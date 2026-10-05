import { getStore } from "@netlify/blobs";
import { json, requireAdmin } from "./_security.mjs";

const STATUSES = ["Pending", "Approved", "Rejected"];

export default async (req, context = {}) => {
  const admin = await requireAdmin(req, context, { scope: "admin-reviews", limit: 180, windowSeconds: 900 });
  if (!admin.ok) return admin.response;

  const store = getStore("magic-light-reviews");

  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "review/" });
    const reviews = [];
    for (const blob of blobs) {
      try {
        const item = await store.get(blob.key, { type: "json", consistency: "strong" });
        if (item) reviews.push(item);
      } catch {}
    }
    reviews.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return json({ ok: true, reviews, statuses: STATUSES, securityMode: admin.mode });
  }

  if (req.method === "PATCH") {
    const len = Number(req.headers.get("content-length") || 0);
    if (len > 8000) return json({ error: "Payload trop volumineux" }, 413);

    let body;
    try { body = await req.json(); }
    catch { return json({ error: "JSON invalide" }, 400); }

    const id = String(body?.id || "").trim().slice(0, 100);
    const status = String(body?.status || "").trim();
    if (!id || !STATUSES.includes(status)) return json({ error: "Données invalides" }, 400);

    const key = `review/${id}.json`;
    const current = await store.get(key, { type: "json", consistency: "strong" });
    if (!current) return json({ error: "Avis introuvable" }, 404);

    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    await store.setJSON(key, updated, {
      metadata: { productRef: updated.productRef || "", status, createdAt: updated.createdAt || "" }
    });
    return json({ ok: true, review: updated });
  }

  if (req.method === "DELETE") {
    const id = String(new URL(req.url).searchParams.get("id") || "").trim().slice(0, 100);
    if (!id || !/^RV-[A-Z0-9-]+$/i.test(id)) return json({ error: "ID invalide" }, 400);
    await store.delete(`review/${id}.json`);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405, { allow: "GET, PATCH, DELETE" });
};
