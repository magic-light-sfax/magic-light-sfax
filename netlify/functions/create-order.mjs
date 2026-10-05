import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import { json, rateLimit, sameOriginOrNoOrigin } from "./_security.mjs";

const clean = (value, max = 200) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const cleanRef = (value) => clean(value, 120).toUpperCase();
const cleanName = (value) => clean(value, 180).toLocaleLowerCase("fr");
const stockKey = (ref) => `stock/${encodeURIComponent(cleanRef(ref))}.json`;
const toQty = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
};
const money = (value) => Number((Math.max(0, Number(value) || 0)).toFixed(3));

function makeOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ML-${stamp}-${suffix}`;
}

function normalizeRequestedItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 50).map((item) => ({
    name: clean(item?.name, 180),
    ref: cleanRef(item?.ref || item?.reference),
    qty: Math.max(1, Math.min(99, Math.floor(Number(item?.qty) || 1)))
  })).filter((item) => item.name || item.ref);
}

function productUnitPrice(product) {
  const base = Number(product?.price);
  if (!Number.isFinite(base) || base <= 0) return null;
  const discount = Math.max(0, Math.min(90, Number(product?.discount) || 0));
  const promo = product?.promo === true && discount > 0;
  return money(promo ? base * (1 - discount / 100) : base);
}

async function catalogueMaps(req) {
  try {
    const url = new URL("/data/products.json", req.url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("catalogue");
    const products = await res.json();
    const active = Array.isArray(products) ? products.filter((p) => p && p.active !== false) : [];
    return {
      byRef: new Map(active.map((p) => [cleanRef(p.reference), p]).filter(([ref]) => ref)),
      byName: new Map(active.map((p) => [cleanName(p.name), p]).filter(([name]) => name))
    };
  } catch {
    return { byRef: new Map(), byName: new Map() };
  }
}

export default async (req, context = {}) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, { allow: "POST" });
  if (!sameOriginOrNoOrigin(req)) return json({ error: "Origine refusée" }, 403);

  const rl = await rateLimit(req, context, { scope: "create-order", limit: 12, windowSeconds: 600 });
  if (!rl.ok) return json({ error: "Trop de commandes envoyées. Réessayez dans quelques minutes." }, 429, { "retry-after": String(rl.retryAfter) });

  const len = Number(req.headers.get("content-length") || 0);
  if (len > 40000) return json({ error: "Payload trop volumineux" }, 413);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const client = {
    name: clean(body?.client?.name, 120),
    phone: clean(body?.client?.phone, 40),
    email: clean(body?.client?.email, 160).toLowerCase(),
    address: clean(body?.client?.address, 220),
    city: clean(body?.client?.city, 100)
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(client.email);
  const phoneDigits = client.phone.replace(/\D/g, "");
  if (!client.name || !client.address || !emailOk || phoneDigits.length < 8 || phoneDigits.length > 15) {
    return json({ error: "Informations client invalides ou incomplètes" }, 400);
  }

  const requested = normalizeRequestedItems(body?.items);
  if (!requested.length) return json({ error: "Panier vide" }, 400);

  const catalogue = await catalogueMaps(req);
  if (!catalogue.byRef.size && !catalogue.byName.size) return json({ error: "Catalogue temporairement indisponible" }, 503);

  const items = [];
  for (const row of requested) {
    const product = (row.ref && catalogue.byRef.get(row.ref)) || (row.name && catalogue.byName.get(cleanName(row.name)));
    if (!product) return json({ error: `Produit introuvable: ${row.ref || row.name}` }, 400);
    const unitPrice = productUnitPrice(product);
    if (unitPrice === null) return json({ error: `Prix indisponible pour ${clean(product.name, 160)}` }, 409);
    items.push({
      name: clean(product.name, 160),
      ref: cleanRef(product.reference),
      qty: row.qty,
      unitPrice
    });
  }

  const stockStore = getStore("magic-light-stock");
  const stockUpdates = [];

  for (const item of items) {
    const product = catalogue.byRef.get(item.ref);
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

  const subtotal = money(items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0));
  const shipping = subtotal >= 350 ? 0 : 8.5;
  const total = money(subtotal + shipping);
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
    subtotal,
    shipping: money(shipping),
    total,
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
