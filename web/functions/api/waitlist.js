// POST /api/waitlist
// Validates email, applies per-IP rate limit, writes signup to KV.
// Cloudflare Pages auto-routes this file to /api/waitlist.
// Non-POST methods receive 405 automatically because only onRequestPost is exported.

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid email" }, 400);
  }

  const email = body && typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return jsonResponse({ error: "Invalid email" }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip") || "unknown";

  // Rate limit: 5 per hour per IP. Failures here fail open (don't block users on infra flake).
  const rateKey = `ratelimit:${ip}`;
  let count = 0;
  try {
    const stored = await env.SMARTCLOSER_WAITLIST.get(rateKey);
    count = stored ? parseInt(stored, 10) || 0 : 0;
  } catch (err) {
    console.warn("Rate limit read failed:", err);
  }

  if (count >= 5) {
    return jsonResponse({ error: "Too many requests" }, 429);
  }

  try {
    await env.SMARTCLOSER_WAITLIST.put(rateKey, String(count + 1), {
      expirationTtl: 3600,
    });
  } catch (err) {
    console.warn("Rate limit write failed:", err);
  }

  // Email is the key suffix so duplicates are idempotent overwrites.
  try {
    const record = {
      email,
      created_at: new Date().toISOString(),
      ip,
      user_agent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
    };
    await env.SMARTCLOSER_WAITLIST.put(`mail:${email}`, JSON.stringify(record));
    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    console.error("KV write failed:", err);
    return jsonResponse({ error: "Server error" }, 500);
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(s) {
  return (
    typeof s === "string" &&
    s.length > 0 &&
    s.length <= 254 &&
    EMAIL_PATTERN.test(s)
  );
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
