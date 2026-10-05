import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

const FALLBACK_ADMIN_KEY_SHA256 = "6ae381554ea20498d91a714df974c2d8bee2133f0b23fe6316307ac0c38cd0a7";
const sha256 = (value) => createHash("sha256").update(String(value ?? ""), "utf8").digest();
function safeEqual(a, b) {
  try { return a.length === b.length && timingSafeEqual(a, b); }
  catch { return false; }
}
function authorized(req) {
  const provided = String(req.headers.get("x-admin-key") || "").trim();
  if (!provided) return false;
  const providedHash = sha256(provided);
  const envKey = String(process.env.ORDER_ADMIN_KEY || "").trim();
  const envMatch = envKey ? safeEqual(providedHash, sha256(envKey)) : false;
  const fallbackMatch = safeEqual(providedHash, Buffer.from(FALLBACK_ADMIN_KEY_SHA256, "hex"));
  return envMatch || fallbackMatch;
}

const cleanRef = (value) => String(value ?? "").trim().toUpperCase().slice(0, 120);
const keyFor = (ref) => `stock/${encodeURIComponent(cleanRef(ref))}.json`;
const toInt = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(999999, Math.floor(n))) : fallback;
};
function state(ref, qty, alert, updatedAt = "") {
  const q = toInt(qty, null);
  const a = toInt(alert, 3);
  let status = "unmanaged";
  if (q !== null) status = q <= 0 ? "out" : q <= a ? "low" : "in";
  return { reference: cleanRef(ref), qty: q, alert: a, status, updatedAt };
}

export default async (req) => {
  const store = getStore("magic-light-stock");

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "stock/" });
    const overrides = {};
    for (const blob of blobs) {
      try {
        const item = await store.get(blob.key, { type: "json", consistency: "strong" });
        if (item?.reference) overrides[cleanRef(item.reference)] = state(item.reference, item.qty, item.alert, item.updatedAt || "");
      } catch {}
    }
    return json({ ok: true, overrides });
  }

  if (req.method !== "PATCH" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Accès refusé" }, 401);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const inputItems = Array.isArray(body?.items) ? body.items.slice(0, 500) : [body];
  const saved = [];
  for (const input of inputItems) {
    const reference = cleanRef(input?.reference);
    if (!reference) continue;
    const qty = toInt(input?.qty, null);
    const alert = toInt(input?.alert, 3);
    if (qty === null) return json({ error: `Quantité invalide pour ${reference}` }, 400);
    const updatedAt = new Date().toISOString();
    const item = state(reference, qty, alert, updatedAt);
    await store.setJSON(keyFor(reference), item, { metadata: { reference, qty, alert, updatedAt } });
    saved.push(item);
  }

  if (!saved.length) return json({ error: "Aucun stock valide à enregistrer" }, 400);
  return json({ ok: true, items: saved });
};
