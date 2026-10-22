const SUPABASE_URL="https://mjtphztvjnfjlhtxtwjz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_tu2xBCVGLQyPyddMT-poMQ_BFRx2nmx";
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Authorization");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return res.status(401).json({ error: "unauthorized" });
  try {
    const authResponse = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: authorization }
    });
    if (!authResponse.ok) return res.status(401).json({ error: "unauthorized" });
    const user = await authResponse.json();
    if (!user || !user.id) return res.status(401).json({ error: "unauthorized" });
    const profileResponse = await fetch(
      SUPABASE_URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=id",
      { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: authorization } }
    );
    if (!profileResponse.ok) return res.status(403).json({ error: "forbidden" });
    const profiles = await profileResponse.json();
    if (!Array.isArray(profiles) || profiles.length !== 1) return res.status(403).json({ error: "forbidden" });
    const url = process.env.BRUNO_OPENING_URL;
    if (!url) return res.status(503).json({ error: "video_unavailable" });
    return res.status(200).json({ url });
  } catch (_) {
    return res.status(503).json({ error: "video_unavailable" });
  }
}