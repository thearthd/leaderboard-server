const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const app = express();
const DATA_FILE = "leaderboard.json";

// Enable CORS for all origins (adjust if you want to restrict)
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Load leaderboard from file if it exists
let leaderboard = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    const rawData = fs.readFileSync(DATA_FILE, "utf8");
    leaderboard = JSON.parse(rawData);
  } catch (err) {
    console.error("Failed to read leaderboard.json:", err);
  }
}

// HOME PAGE for testing
app.get("/", (req, res) => {
  res.send(`
    <h1>Leaderboard Server</h1>
    <p>Visit <a href="/leaderboard">/leaderboard</a> to view the leaderboard data.</p>
    <p>POST to <code>/leaderboard/player</code> with JSON <code>{ "name": "playerName", "score": 123 }</code> to add/update a player.</p>
  `);
});

// GET full leaderboard
app.get("/leaderboard", (req, res) => {
  res.json(leaderboard);
});

// POST full leaderboard (replace entire list)
app.post("/leaderboard", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ success: false, error: "Expected an array of players" });
  }

  leaderboard = req.body;

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
    res.json({ success: true, message: "Leaderboard replaced" });
  } catch (err) {
    console.error("Failed to save leaderboard:", err);
    res.status(500).json({ success: false, error: "File save error" });
  }
});

// POST single player update/add
app.post("/leaderboard/player", (req, res) => {
  const { name, score } = req.body;

  if (typeof name !== "string" || typeof score !== "number") {
    return res.status(400).json({ success: false, error: "Invalid or missing 'name' or 'score'" });
  }

  const idx = leaderboard.findIndex(player => player.name === name);
  if (idx >= 0) {
    leaderboard[idx].score = score;
  } else {
    leaderboard.push({ name, score });
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
    res.json({ success: true, message: `Player ${name} added/updated` });
  } catch (err) {
    console.error("Failed to save player:", err);
    res.status(500).json({ success: false, error: "File save error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Leaderboard API running at http://localhost:${PORT}`);
});
