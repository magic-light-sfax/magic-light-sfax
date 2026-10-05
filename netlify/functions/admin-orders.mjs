import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

const STATUSES = ["Nouvelle", "Confirmée", "Préparée", "Expédiée", "Livrée", "Annulée"];
const FALLBACK_ADMIN_KEY_SHA256 = "6ae381554ea20498d91a714df974c2d8bee2133f0b23fe6316307ac0c38cd0a7";
const sha256 = (value) => createHash("sha256").update(String(value ?? ""), "utf8").digest();
const cleanRef = (value) => String(value ?? "").trim().toUpperCase().slice(0, 120);
const stockKey = (ref) => `stock/${encodeURIComponent(cleanRef(ref))}.json`;

function safeEqual(a, b) {
  try { return a.length === b.length && timingSafeEqual(a, b); }
  catch { return false; }
}
function authorized(req) {
  const provided = String(req.headers.get("x-admin-key") || "").trim();
  if (!provided) return { ok: false, setup: false };
  const providedHash = sha256(provided);
  const expected = String(process.env.ORDER_ADMIN_KEY || "").trim();
  const envKeyMatches = expected ? safeEqual(providedHash, sha256(expected)) : false;
  const fallbackKeyMatches = safeEqual(providedHash, Buffer.from(FALLBACK_ADMIN_KEY_SHA256, "hex"));
  return { ok: envKeyMatches || fallbackKeyMatches, setup: false };
}

async function adjustCancelledStock(order, direction) {
  // direction +1 = restore stock on cancellation, -1 = reserve again when reopening.
  const store = getStore("magic-light-stock");
  const changes = [];
  for (const item of order?.items || []) {
    const ref = cleanRef(item?.ref || item?.reference);
    if (!ref) continue;
    let current = null;
    try { current = await store.get(stockKey(ref), { type: "json", consistency: "strong" }); }
    catch {}
    if (!current || !Number.isFinite(Number(current.qty))) continue;
    const amount = Math.max(1, Number(item?.qty) || 1);
    const nowQty = Math.max(0, Math.floor(Number(current.qty)));
    if (direction < 0 && amount > nowQty) {
      return { ok: false, error: `Stock insuffisant pour rouvrir la commande (${ref})`, reference: ref, available: nowQty };
    }
    changes.push({
      reference: ref,
      qty: direction > 0 ? nowQty + amount : nowQty - amount,
      alert: Math.max(0, Math.floor(Number(current.alert) || 3))
    });
  }
  for (const change of changes) {
    const updatedAt = new Date().toISOString();
    await store.setJSON(stockKey(change.reference), { ...change, updatedAt }, {
      metadata: { reference: change.reference, qty: change.qty, alert: change.alert, updatedAt }
    });
  }
  return { ok: true, changed: changes.length };
}

export default async (req) => {
  const auth = authorized(req);
  if (auth.setup) return json({ error: "Configuration Admin requise", setupRequired: true }, 503);
  if (!auth.ok) return json({ error: "Accès refusé" }, 401);

  const store = getStore("magic-light-orders");

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "order/" });
    const orders = [];
    for (const blob of blobs) {
      try {
        const order = await store.get(blob.key, { type: "json", consistency: "strong" });
        if (order) orders.push(order);
      } catch {}
    }
    orders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return json({ ok: true, orders, statuses: STATUSES });
  }

  if (req.method === "PATCH") {
    let body;
    try { body = await req.json(); }
    catch { return json({ error: "JSON invalide" }, 400); }

    const orderNumber = String(body?.orderNumber || "").trim();
    const status = String(body?.status || "").trim();
    if (!orderNumber || !STATUSES.includes(status)) return json({ error: "Données invalides" }, 400);

    const key = `order/${orderNumber}.json`;
    const current = await store.get(key, { type: "json", consistency: "strong" });
    if (!current) return json({ error: "Commande introuvable" }, 404);

    if (status === "Annulée" && current.status !== "Annulée") {
      await adjustCancelledStock(current, +1);
    } else if (current.status === "Annulée" && status !== "Annulée") {
      const reserve = await adjustCancelledStock(current, -1);
      if (!reserve.ok) return json(reserve, 409);
    }

    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    await store.setJSON(key, updated, { metadata: { status, createdAt: updated.createdAt || "" } });
    return json({ ok: true, order: updated });
  }

  return json({ error: "Method not allowed" }, 405);
};
