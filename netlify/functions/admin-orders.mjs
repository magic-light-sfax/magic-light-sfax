import { getStore } from "@netlify/blobs";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

const STATUSES = ["Nouvelle", "Confirmée", "Préparée", "Expédiée", "Livrée", "Annulée"];

function authorized(req) {
  const expected = process.env.ORDER_ADMIN_KEY;
  if (!expected) return { ok: false, setup: true };
  const provided = req.headers.get("x-admin-key") || "";
  return { ok: provided === expected, setup: false };
}

export default async (req) => {
  const auth = authorized(req);
  if (auth.setup) return json({ error: "ORDER_ADMIN_KEY non configurée", setupRequired: true }, 503);
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
