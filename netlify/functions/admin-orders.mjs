import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "./_security.mjs";

const STATUSES = ["Nouvelle", "Confirmée", "Préparée", "Expédiée", "Livrée", "Annulée"];
const cleanRef = (value) => String(value ?? "").trim().toUpperCase().slice(0, 120);
const stockKey = (ref) => `stock/${encodeURIComponent(cleanRef(ref))}.json`;

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

export default async (req, context = {}) => {
  const admin = await requireAdmin(req, context, { scope: "admin-orders", limit: 180, windowSeconds: 900 });
  if (!admin.ok) return admin.response;

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
    return json({ ok: true, orders, statuses: STATUSES, securityMode: admin.mode });
  }

  if (req.method === "PATCH") {
    const len = Number(req.headers.get("content-length") || 0);
    if (len > 8000) return json({ error: "Payload trop volumineux" }, 413);

    let body;
    try { body = await req.json(); }
    catch { return json({ error: "JSON invalide" }, 400); }

    const orderNumber = String(body?.orderNumber || "").trim().slice(0, 80);
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

  return json({ error: "Method not allowed" }, 405, { allow: "GET, PATCH" });
};
