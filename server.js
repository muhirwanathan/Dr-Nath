const express = require("express");
const fs = require("fs");
const path = require("path");
const categories = require("./data/categories");

// Node 18+ has a built-in global fetch. Older Node (e.g. Node 16 on legacy
// deployment servers) doesn't, so fall back to the node-fetch package there.
const fetch = globalThis.fetch || require("node-fetch");

// Minimal .env loader (no dependency needed — Node 18+ has global fetch already).
(function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  });
})();

const app = express();
const PORT = process.env.PORT || 3000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PROGRESS_FILE = path.join(__dirname, "data", "progress.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Helpers -------------------------------------------------------------

function readProgress() {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return {};
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch (err) {
    console.error("Failed to read progress file:", err.message);
    return {};
  }
}

function writeProgress(data) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Failed to write progress file:", err.message);
    return false;
  }
}

function parseDurationToLabel(iso) {
  // Very small ISO 8601 duration -> "MM:SS" parser (covers PT#M#S / PT#H#M#S)
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  const totalMin = h * 60 + m;
  return `${totalMin}:${String(s).padStart(2, "0")}`;
}

// ---- Routes ---------------------------------------------------------------

app.get("/api/categories", (req, res) => {
  const summary = categories.map((c) => ({ id: c.id, label: c.label, icon: c.icon, blurb: c.blurb }));
  res.json(summary);
});

// Fetch (real or fallback) videos for a category, with optional free-text query
app.get("/api/videos", async (req, res) => {
  const { category, q } = req.query;
  const cat = categories.find((c) => c.id === category);

  if (!cat) {
    return res.status(400).json({ error: "Unknown or missing category." });
  }

  const searchTerm = q && q.trim() ? `${cat.searchQuery} ${q}` : cat.searchQuery;

  // No API key configured yet -> serve the curated fallback so the app still works
  if (!YOUTUBE_API_KEY) {
    return res.json({
      source: "fallback",
      note: "No YOUTUBE_API_KEY configured — showing a curated fallback video for this category.",
      videos: [cat.fallback]
    });
  }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(
      searchTerm
    )}&key=${YOUTUBE_API_KEY}`;

    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) throw new Error(`YouTube search failed: ${searchResp.status}`);
    const searchData = await searchResp.json();

    const ids = (searchData.items || []).map((item) => item.id.videoId).filter(Boolean);
    if (ids.length === 0) throw new Error("No results returned from YouTube.");

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(
      ","
    )}&key=${YOUTUBE_API_KEY}`;
    const detailsResp = await fetch(detailsUrl);
    if (!detailsResp.ok) throw new Error(`YouTube video details failed: ${detailsResp.status}`);
    const detailsData = await detailsResp.json();

    const videos = (detailsData.items || []).map((item) => ({
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      duration: item.contentDetails.duration,
      durationLabel: parseDurationToLabel(item.contentDetails.duration),
      views: parseInt(item.statistics.viewCount || "0", 10),
      thumbnail: item.snippet.thumbnails?.medium?.url || ""
    }));

    res.json({ source: "youtube", videos });
  } catch (err) {
    console.error("YouTube API error, falling back:", err.message);
    res.json({
      source: "fallback",
      note: "The YouTube API is currently unavailable — showing a curated fallback video.",
      videos: [cat.fallback]
    });
  }
});

// ---- Progress tracking (simple per-browser userId, no login required) -----

app.get("/api/progress/:userId", (req, res) => {
  const progress = readProgress();
  res.json(progress[req.params.userId] || { completed: [] });
});

app.post("/api/progress/:userId/complete", (req, res) => {
  const { categoryId } = req.body || {};
  if (!categoryId) return res.status(400).json({ error: "categoryId is required." });

  const progress = readProgress();
  const userId = req.params.userId;
  if (!progress[userId]) progress[userId] = { completed: [] };
  if (!progress[userId].completed.includes(categoryId)) {
    progress[userId].completed.push(categoryId);
  }

  const ok = writeProgress(progress);
  if (!ok) return res.status(500).json({ error: "Could not save progress." });

  res.json(progress[userId]);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyConfigured: Boolean(YOUTUBE_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Dr. NATH server running on http://localhost:${PORT}`);
});
