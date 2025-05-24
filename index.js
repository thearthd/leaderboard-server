const express    = require("express");
const bodyParser = require("body-parser");
const cors       = require("cors");
const fs         = require("fs");
const path       = require("path");

const app       = express();
const DATA_FILE = path.join(__dirname, "leaderboard.json");

// ─── MIDDLEWARE ─────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// Load existing leaderboard (or start empty)
let leaderboard = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    leaderboard = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("Failed to read leaderboard.json:", err);
    leaderboard = [];
  }
}

// ─── ROUTES ──────────────────────────────────────────────────────

// Home page for quick test
app.get("/", (req, res) => {
  res.send(`
    <h1>Leaderboard Server</h1>
    <p>GET  <a href="/leaderboard">/leaderboard</a></p>
    <p>POST <code>/leaderboard</code> with JSON <code>{ name, score }</code> or full array</p>
  `);
});

// GET: return current leaderboard, no caching
app.get("/leaderboard", (req, res) => {
  res.set("Cache-Control", "no-store");
  return res.json(leaderboard);
});

// POST: accept either a full array or a single { name, score } update
app.post("/leaderboard", (req, res) => {
  const body = req.body;

  // Bulk replace if array
  if (Array.isArray(body)) {
    leaderboard = body.slice();
  }
  // Single update if object with name & score
  else if (
    typeof body === "object" &&
    typeof body.name  === "string" &&
    typeof body.score === "number"
  ) {
    const { name, score } = body;
    const idx = leaderboard.findIndex(p => p.name === name);
    if (idx >= 0) {
      leaderboard[idx].score = score;
    } else {
      leaderboard.push({ name, score });
    }
  }
  else {
    return res
      .status(400)
      .json({ success: false, error: "Expected array or {name, score}" });
  }

  // Persist to disk
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
    return res.json({ success: true });
  } catch (err) {
    console.error("Failed to save leaderboard.json:", err);
    return res.status(500).json({ success: false, error: "File write error" });
  }
});

// ─── START SERVER ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Leaderboard API listening on port ${PORT}`);
});
