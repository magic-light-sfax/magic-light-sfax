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
const cleanRef = (value) => clean(value, 120).toUpperCase();
const stockKey = (ref) => `stock/${encodeURIComponent(cleanRef(ref))}.json`;
const toQty = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
};

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
    ref: cleanRef(item?.ref || item?.reference),
    qty: Math.max(1, Math.min(999, Number(item?.qty) || 1)),
    unitPrice: Math.max(0, Number(item?.unitPrice) || 0)
  })).filter((item) => item.name);
}

async function loadCatalogue(req) {
  try {
    const url = new URL("/data/products.json", req.url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return new Map();
    const products = await res.json();
    return new Map((Array.isArray(products) ? products : []).map((p) => [cleanRef(p?.reference), p]));
  } catch {
    return new Map();
  }
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

  // Live stock is an overlay in Netlify Blobs. If no overlay exists, the
  // stockQty value published with the product is used as the starting stock.
  const catalogue = await loadCatalogue(req);
  const stockStore = getStore("magic-light-stock");
  const stockUpdates = [];

  for (const item of items) {
    if (!item.ref) continue;
    const product = catalogue.get(item.ref);
    let override = null;
    try { override = await stockStore.get(stockKey(item.ref), { type: "json", consistency: "strong" }); }
    catch {}
    const defaultQty = toQty(product?.stockQty, null);
    const currentQty = toQty(override?.qty, defaultQty);
    const alert = toQty(override?.alert, toQty(product?.stockAlert, 3));
    if (currentQty === null) continue;
    if (item.qty > currentQty) {
      return json({
        error: `Stock insuffisant pour ${item.name}`,
        reference: item.ref,
        requested: item.qty,
        available: currentQty
      }, 409);
    }
    stockUpdates.push({ reference: item.ref, qty: currentQty - item.qty, alert });
  }

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

  const orderStore = getStore("magic-light-orders");
  await orderStore.setJSON(`order/${orderNumber}.json`, order, {
    metadata: { status: order.status, createdAt }
  });

  for (const update of stockUpdates) {
    const updatedAt = new Date().toISOString();
    await stockStore.setJSON(stockKey(update.reference), { ...update, updatedAt }, {
      metadata: { reference: update.reference, qty: update.qty, alert: update.alert, updatedAt }
    });
  }

  return json({
    ok: true,
    orderNumber,
    status: order.status,
    createdAt,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    stockUpdated: stockUpdates.length
  }, 201);
};
