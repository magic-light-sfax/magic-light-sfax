import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

const clean = (value, max = 200) => String(value ?? "").trim().slice(0, max);

function makeOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `ML-${stamp}-${suffix}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map((item) => ({
    name: clean(item?.name, 160),
    qty: Math.max(1, Math.min(999, Number(item?.qty) || 1)),
    unitPrice: Math.max(0, Number(item?.unitPrice) || 0)
  })).filter((item) => item.name);
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const client = {
    name: clean(body?.client?.name, 120),
    phone: clean(body?.client?.phone, 40),
    email: clean(body?.client?.email, 160),
    address: clean(body?.client?.address, 220),
    city: clean(body?.client?.city, 100)
  };

  if (!client.name || !client.phone || !client.email || !client.address) {
    return json({ error: "Informations client incomplètes" }, 400);
  }

  const items = normalizeItems(body?.items);
  if (!items.length) return json({ error: "Panier vide" }, 400);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const shipping = subtotal >= 350 ? 0 : 8.5;
  const total = subtotal + shipping;
  const orderNumber = makeOrderNumber();
  const createdAt = new Date().toISOString();

  const order = {
    orderNumber,
    status: "Nouvelle",
    channel: "WhatsApp",
    createdAt,
    updatedAt: createdAt,
    client,
    items,
    subtotal: Number(subtotal.toFixed(3)),
    shipping: Number(shipping.toFixed(3)),
    total: Number(total.toFixed(3)),
    source: clean(body?.source || "produits", 80),
    page: clean(body?.page || "", 500),
    geo: {
      city: clean(context?.geo?.city || "", 100),
      country: clean(context?.geo?.country?.name || context?.geo?.country?.code || "", 100)
    }
  };

  const store = getStore("magic-light-orders");
  await store.setJSON(`order/${orderNumber}.json`, order, {
    metadata: { status: order.status, createdAt }
  });

  return json({
    ok: true,
    orderNumber,
    status: order.status,
    createdAt,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total
  }, 201);
};
