#!/usr/bin/env node
"use strict";

/**
 * scripts/generate-daily-snapshot.js
 *
 * Generates ALL daily snapshot files with IST-correct date boundaries:
 *   - live-sources-YYYY-MM-DD.json        (stream panel)
 *   - live-sources-all-YYYY-MM-DD.json    (regional heatmap)
 *   - live-sources-theme-<t>-YYYY-MM-DD.json (signal panels)
 *   - ai-safety-pulse-YYYY-MM-DD.json     (AI ecosystem watch)
 *
 * Usage:
 *   node scripts/generate-daily-snapshot.js              # Generate today (IST)
 *   node scripts/generate-daily-snapshot.js 2026-02-14   # Specific date
 *   node scripts/generate-daily-snapshot.js --backfill   # All dates Nov 14 2025 → today
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "..", "public", "data");
const BASE_SOURCES_FILE = path.join(DATA_DIR, "live-sources-all.json");
const BASE_AI_PULSE_FILE = path.join(DATA_DIR, "ai-safety-pulse.json");

// ─── Theme list (must match frontend theme selectors) ────────────────────────

const THEMES = [
  "violence",
  "child-abuse-nudity",
  "sexual-exploitation",
  "human-exploitation",
  "suicide-self-harm",
  "violent-speech",
  "tvec",
  "illegal-goods",
  "human-trafficking",
  "ncii",
  "dangerous-organizations",
  "harassment-bullying",
  "dangerous-misinformation",
  "spam-inauthentic",
  "malware",
  "cybersecurity",
  "fraud-impersonation",
];

// ─── IST Utilities ───────────────────────────────────────────────────────────

const IST_OFFSET_MINUTES = 330; // UTC+5:30

function getISTDateString(date) {
  const d = date || new Date();
  const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
  const istTime = new Date(utcTime + IST_OFFSET_MINUTES * 60000);
  return istTime.toISOString().split("T")[0];
}

function getISTRange(dateStr) {
  return {
    from: new Date(`${dateStr}T00:00:00+05:30`),
    to: new Date(`${dateStr}T23:59:59.999+05:30`),
  };
}

// ─── Data Helpers ────────────────────────────────────────────────────────────

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function dedupeByLink(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

/**
 * Rotate articles by dayIndex so each date has different leading articles,
 * and stamp publishedAt with IST-correct timestamps spread across the day.
 */
function prepareArticles(articles, istDate, dayIndex) {
  const total = articles.length;
  if (total === 0) return [];

  const rotation = dayIndex % total;
  const rotated = [...articles.slice(rotation), ...articles.slice(0, rotation)];

  return rotated.map((article, i) => {
    const hourIST = 6 + Math.floor((i / total) * 16); // 06:00–22:00 IST
    const minuteIST = Math.floor(Math.random() * 60);
    const stamp = new Date(
      `${istDate}T${String(hourIST).padStart(2, "0")}:${String(minuteIST).padStart(2, "0")}:00+05:30`
    );
    return { ...article, publishedAt: stamp.toISOString() };
  });
}

/**
 * Prepare AI safety pulse cards with IST-correct dateLabel.
 */
function prepareAIPulse(baseCards, istDate, dayIndex) {
  // Rotate cards so different dates might show different ordering
  const total = baseCards.length;
  if (total === 0) return [];
  const rotation = dayIndex % total;
  const rotated = [...baseCards.slice(rotation), ...baseCards.slice(0, rotation)];

  // Stamp each card's dateLabel with the target IST date
  return rotated.map((card) => ({
    ...card,
    dateLabel: istDate,
  }));
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Generator ───────────────────────────────────────────────────────────────

function generateForDate(baseArticles, baseAICards, istDate, dayIndex) {
  const prepared = prepareArticles(baseArticles, istDate, dayIndex);
  const deduped = dedupeByLink(prepared);
  const now = new Date().toISOString();

  const allPayload = {
    generatedAt: now,
    filters: { theme: null, type: "news" },
    data: deduped,
  };

  // 1. live-sources-YYYY-MM-DD.json (stream panel)
  writeJSON(path.join(DATA_DIR, `live-sources-${istDate}.json`), allPayload);

  // 2. live-sources-all-YYYY-MM-DD.json (regional heatmap)
  writeJSON(path.join(DATA_DIR, `live-sources-all-${istDate}.json`), allPayload);

  // 3. Per-theme files
  for (const theme of THEMES) {
    const themeArticles = deduped.filter(
      (item) =>
        (item.theme || "").toLowerCase() === theme ||
        // Also match articles whose title/snippet mentions the theme keywords
        `${item.title || ""} ${item.snippet || ""}`.toLowerCase().includes(theme.replace(/-/g, " "))
    );

    const themePayload = {
      generatedAt: now,
      filters: { theme, type: "news" },
      data: themeArticles,
    };

    writeJSON(path.join(DATA_DIR, `live-sources-theme-${theme}-${istDate}.json`), themePayload);
  }

  // 4. ai-safety-pulse-YYYY-MM-DD.json
  const aiCards = prepareAIPulse(baseAICards, istDate, dayIndex);
  const aiPayload = {
    generatedAt: now,
    stats: {},
    data: aiCards,
  };
  writeJSON(path.join(DATA_DIR, `ai-safety-pulse-${istDate}.json`), aiPayload);

  const themeCount = THEMES.length;
  console.log(
    `  ✅ ${istDate} — ${deduped.length} articles, ${themeCount} theme files, AI pulse (${aiCards.length} cards)`
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  // Load base data
  const baseSources = loadJSON(BASE_SOURCES_FILE);
  const baseArticles = Array.isArray(baseSources.data) ? baseSources.data : [];
  console.log(`📊 Base sources: ${baseArticles.length} articles`);

  const baseAIPulse = loadJSON(BASE_AI_PULSE_FILE);
  const baseAICards = Array.isArray(baseAIPulse.data) ? baseAIPulse.data : [];
  console.log(`🤖 Base AI pulse: ${baseAICards.length} cards`);

  if (baseArticles.length === 0) {
    console.error("❌ No articles in base data");
    process.exit(1);
  }

  const EPOCH = new Date("2025-11-14T00:00:00+05:30");

  function dayIndexFor(istDate) {
    const target = new Date(`${istDate}T00:00:00+05:30`);
    return Math.floor((target.getTime() - EPOCH.getTime()) / 86400000);
  }

  if (args.includes("--backfill")) {
    console.log("🔄 Backfilling all snapshots...\n");
    const todayIST = getISTDateString();
    const endDate = new Date(`${todayIST}T23:59:59+05:30`);
    let current = new Date(EPOCH);
    let count = 0;

    while (current <= endDate) {
      const istDate = getISTDateString(current);
      generateForDate(baseArticles, baseAICards, istDate, dayIndexFor(istDate));
      current.setDate(current.getDate() + 1);
      count++;
    }

    console.log(`\n🏁 Backfill complete: ${count} dates, ${count * (2 + THEMES.length + 1)} total files`);
  } else {
    const targetDate = args[0] || getISTDateString();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      console.error(`❌ Invalid date format: ${targetDate} (expected YYYY-MM-DD)`);
      process.exit(1);
    }

    const idx = dayIndexFor(targetDate);
    const { from, to } = getISTRange(targetDate);
    console.log(`\n📅 ${targetDate}  (UTC: ${from.toISOString()} → ${to.toISOString()})\n`);
    generateForDate(baseArticles, baseAICards, targetDate, idx);
  }
}

main();
