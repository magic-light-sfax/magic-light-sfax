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

function pricedValue(product, variant = null) {
  const raw = variant?.price ?? product?.price;
  const base = Number(raw);
  if (!Number.isFinite(base) || base <= 0) return null;
  const discount = Math.max(0, Math.min(90, Number(product?.discount) || 0));
  const promo = product?.promo === true && discount > 0;
  return money(promo ? base * (1 - discount / 100) : base);
}

function activeVariants(product) {
  return Array.isArray(product?.variants)
    ? product.variants.filter((v) => v && v.active !== false)
    : [];
}

function variantTokens(variant) {
  const values = [
    variant?.watt,
    variant?.power,
    variant?.color,
    variant?.couleur,
    variant?.cct,
    variant?.temperature,
    variant?.temperatureColor,
    variant?.intensity,
    variant?.amperage,
    variant?.length,
    variant?.diameter,
    variant?.pack
  ];
  if (Array.isArray(variant?.attributes)) {
    for (const attr of variant.attributes) values.push(attr?.value ?? attr?.val ?? attr?.choice);
  }
  return values.map((v) => cleanName(v)).filter(Boolean);
}

function findVariantForRow(product, row) {
  const variants = activeVariants(product);
  if (!variants.length) return null;

  if (row.ref) {
    const byReference = variants.find((v) => cleanRef(v.reference) === row.ref);
    if (byReference) return byReference;
  }

  const rowName = cleanName(row.name);
  if (!rowName) return null;

  let best = null;
  let bestScore = 0;
  for (const variant of variants) {
    let score = 0;
    for (const token of variantTokens(variant)) {
      if (token && rowName.includes(token)) score += 1;
    }
    if (score > bestScore) {
      best = variant;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

async function catalogueMaps(req) {
  try {
    const url = new URL("/data/products.json", req.url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("catalogue");
    const products = await res.json();
    const active = Array.isArray(products) ? products.filter((p) => p && p.active !== false) : [];
    const byRef = new Map();
    const byName = new Map();

    for (const product of active) {
      const baseRef = cleanRef(product.reference);
      const baseName = cleanName(product.name);
      if (baseRef) byRef.set(baseRef, { product, variant: null });
      if (baseName) byName.set(baseName, product);
      for (const variant of activeVariants(product)) {
        const variantRef = cleanRef(variant.reference);
        if (variantRef) byRef.set(variantRef, { product, variant });
      }
    }

    return { active, byRef, byName };
  } catch {
    return { active: [], byRef: new Map(), byName: new Map() };
  }
}

function resolveRequestedProduct(catalogue, row) {
  if (row.ref && catalogue.byRef.has(row.ref)) return catalogue.byRef.get(row.ref);

  const rowName = cleanName(row.name);
  if (!rowName) return null;

  const exact = catalogue.byName.get(rowName);
  if (exact) return { product: exact, variant: findVariantForRow(exact, row) };

  let bestProduct = null;
  let bestNameLength = -1;
  for (const product of catalogue.active) {
    const baseName = cleanName(product.name);
    if (!baseName) continue;
    if (rowName === baseName || rowName.startsWith(baseName + " — ") || rowName.startsWith(baseName + " - ")) {
      if (baseName.length > bestNameLength) {
        bestProduct = product;
        bestNameLength = baseName.length;
      }
    }
  }

  if (!bestProduct) return null;
  return { product: bestProduct, variant: findVariantForRow(bestProduct, row) };
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
  if (!catalogue.active.length) return json({ error: "Catalogue temporairement indisponible" }, 503);

  const items = [];
  for (const row of requested) {
    const resolved = resolveRequestedProduct(catalogue, row);
    if (!resolved?.product) return json({ error: `Produit introuvable: ${row.ref || row.name}` }, 400);

    const { product, variant } = resolved;
    const unitPrice = pricedValue(product, variant);
    if (unitPrice === null) return json({ error: `Prix indisponible pour ${clean(product.name, 160)}` }, 409);

    items.push({
      name: clean(row.name || product.name, 180),
      ref: cleanRef(variant?.reference || product.reference),
      baseRef: cleanRef(product.reference),
      qty: row.qty,
      unitPrice
    });
  }

  const stockStore = getStore("magic-light-stock");
  const stockUpdates = [];

  for (const item of items) {
    const baseEntry = catalogue.byRef.get(item.baseRef);
    const product = baseEntry?.product;
    const variant = activeVariants(product).find((v) => cleanRef(v.reference) === item.ref) || null;
    let override = null;
    try { override = await stockStore.get(stockKey(item.ref), { type: "json", consistency: "strong" }); }
    catch {}

    const defaultQty = toQty(variant?.stockQty, toQty(product?.stockQty, null));
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
  const orderItems = items.map(({ baseRef, ...item }) => item);

  const order = {
    orderNumber,
    status: "Nouvelle",
    channel: "WhatsApp",
    createdAt,
    updatedAt: createdAt,
    client,
    items: orderItems,
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
