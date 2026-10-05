import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const sha256Buffer = (value) => createHash("sha256").update(String(value ?? ""), "utf8").digest();
const sha256Hex = (value) => createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");

function safeEqual(a, b) {
  try { return a.length === b.length && timingSafeEqual(a, b); }
  catch { return false; }
}

export function secureHeaders(extra = {}) {
  return {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    ...extra
  };
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: secureHeaders({ "content-type": "application/json; charset=utf-8", ...extraHeaders })
  });
}

export function sameOriginOrNoOrigin(req) {
  const origin = String(req.headers.get("origin") || "").trim();
  if (!origin) return true;
  try {
    const requestUrl = new URL(req.url);
    const originUrl = new URL(origin);
    return originUrl.protocol === requestUrl.protocol && originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

export function adminAuth(req) {
  const envKey = String(process.env.ORDER_ADMIN_KEY || "").trim();
  if (!envKey) return { ok: false, mode: "unconfigured" };

  const provided = String(req.headers.get("x-admin-key") || "").trim();
  if (!provided) return { ok: false, mode: "none" };

  const ok = safeEqual(sha256Buffer(provided), sha256Buffer(envKey));
  return { ok, mode: ok ? "environment" : "invalid" };
}

function fingerprint(req, context = {}) {
  const rawIp = String(
    context?.ip ||
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  ).trim();
  const ua = String(req.headers.get("user-agent") || "").slice(0, 180);
  const salt = String(process.env.RATE_LIMIT_SALT || "magic-light-rate-limit-v1");
  return sha256Hex(`${salt}|${rawIp}|${ua}`).slice(0, 32);
}

export async function rateLimit(req, context, {
  scope = "generic",
  limit = 30,
  windowSeconds = 600
} = {}) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / windowSeconds);
    const key = `limit/${scope}/${bucket}/${fingerprint(req, context)}.json`;
    const store = getStore("magic-light-security");
    let current = null;
    try { current = await store.get(key, { type: "json", consistency: "strong" }); }
    catch {}
    const count = Math.max(0, Number(current?.count) || 0) + 1;
    await store.setJSON(key, { count, bucket, updatedAt: new Date().toISOString() }, {
      metadata: { scope, bucket, count }
    });
    return {
      ok: count <= limit,
      count,
      limit,
      retryAfter: Math.max(1, (bucket + 1) * windowSeconds - now)
    };
  } catch {
    // Security storage failure should not take the shop offline.
    return { ok: true, count: 0, limit, retryAfter: 0 };
  }
}

export async function requireAdmin(req, context, options = {}) {
  const rl = await rateLimit(req, context, {
    scope: options.scope || "admin",
    limit: options.limit || 120,
    windowSeconds: options.windowSeconds || 900
  });
  if (!rl.ok) {
    return {
      ok: false,
      response: json({ error: "Trop de tentatives. Réessayez plus tard." }, 429, {
        "retry-after": String(rl.retryAfter)
      })
    };
  }

  const auth = adminAuth(req);
  if (auth.mode === "unconfigured") {
    return {
      ok: false,
      response: json({ error: "ORDER_ADMIN_KEY non configurée", setupRequired: true }, 503)
    };
  }
  if (!auth.ok) return { ok: false, response: json({ error: "Accès refusé" }, 401) };
  return { ok: true, mode: auth.mode };
}
