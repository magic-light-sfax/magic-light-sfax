import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "./_security.mjs";

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

export default async (req, context = {}) => {
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

  if (req.method !== "PATCH" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { allow: "GET, POST, PATCH" });
  }

  const admin = await requireAdmin(req, context, { scope: "admin-stock", limit: 180, windowSeconds: 900 });
  if (!admin.ok) return admin.response;

  const len = Number(req.headers.get("content-length") || 0);
  if (len > 120000) return json({ error: "Payload trop volumineux" }, 413);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  if (body?.ping === true) return json({ ok: true, authenticated: true, securityMode: admin.mode });

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
