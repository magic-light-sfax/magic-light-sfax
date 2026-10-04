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

// Fallback production-safe admin key hash.
// The plaintext key is never committed to the public repository.
// If ORDER_ADMIN_KEY exists in Netlify, it always takes priority.
const FALLBACK_ADMIN_KEY_SHA256 = "6ae381554ea20498d91a714df974c2d8bee2133f0b23fe6316307ac0c38cd0a7";

const sha256 = (value) => createHash("sha256").update(String(value ?? ""), "utf8").digest();

function safeEqual(a, b) {
  try {
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function authorized(req) {
  const provided = String(req.headers.get("x-admin-key") || "").trim();
  if (!provided) return { ok: false, setup: false };

  const expected = String(process.env.ORDER_ADMIN_KEY || "").trim();
  if (expected) {
    return { ok: safeEqual(sha256(provided), sha256(expected)), setup: false };
  }

  const fallbackHash = Buffer.from(FALLBACK_ADMIN_KEY_SHA256, "hex");
  return { ok: safeEqual(sha256(provided), fallbackHash), setup: false };
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

    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    await store.setJSON(key, updated, { metadata: { status, createdAt: updated.createdAt || "" } });
    return json({ ok: true, order: updated });
  }

  return json({ error: "Method not allowed" }, 405);
};
