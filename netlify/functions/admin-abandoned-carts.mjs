import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "./_security.mjs";

const FOLLOW_UP_STATUSES = ["Nouveau", "À relancer", "Relancé", "Converti", "Ignoré"];
const clean = (value, max = 300) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const cleanId = (value) => clean(value, 90).replace(/[^a-zA-Z0-9_-]/g, "");

export default async (req, context = {}) => {
  const admin = await requireAdmin(req, context, {
    scope: "admin-abandoned-carts",
    limit: 180,
    windowSeconds: 900
  });
  if (!admin.ok) return admin.response;

  const store = getStore("magic-light-abandoned-carts");

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "cart/" });
    const carts = [];
    for (const blob of blobs) {
      try {
        const cart = await store.get(blob.key, { type: "json", consistency: "strong" });
        if (cart) carts.push(cart);
      } catch {}
    }
    carts.sort((a, b) => String(b.lastSeen || "").localeCompare(String(a.lastSeen || "")));
    return json({
      ok: true,
      carts,
      statuses: FOLLOW_UP_STATUSES,
      securityMode: admin.mode
    });
  }

  if (req.method === "PATCH") {
    if (Number(req.headers.get("content-length") || 0) > 8000) {
      return json({ error: "Payload trop volumineux" }, 413);
    }

    let body;
    try { body = await req.json(); }
    catch { return json({ error: "JSON invalide" }, 400); }

    const sessionId = cleanId(body?.sessionId);
    const followUpStatus = clean(body?.followUpStatus, 30);
    const note = clean(body?.note, 500);
    if (sessionId.length < 12 || !FOLLOW_UP_STATUSES.includes(followUpStatus)) {
      return json({ error: "Données invalides" }, 400);
    }

    const key = `cart/${sessionId}.json`;
    const current = await store.get(key, { type: "json", consistency: "strong" });
    if (!current) return json({ error: "Panier introuvable" }, 404);

    const updated = {
      ...current,
      followUpStatus,
      note,
      followUpUpdatedAt: new Date().toISOString()
    };
    await store.setJSON(key, updated, {
      metadata: {
        lifecycle: updated.lifecycle || "active",
        lastSeen: updated.lastSeen || "",
        followUpStatus
      }
    });
    return json({ ok: true, cart: updated });
  }

  return json({ error: "Method not allowed" }, 405, { allow: "GET, PATCH" });
};
