#!/usr/bin/env node
"use strict";

/**
 * generate-daily-snapshot.js
 *
 * Generates daily snapshot files with IST-correct date boundaries.
 *
 * Usage:
 *   node generate-daily-snapshot.js              # Generate today's IST snapshot
 *   node generate-daily-snapshot.js 2026-02-14   # Generate specific IST date
 *   node generate-daily-snapshot.js --backfill   # Regenerate all snapshots (Nov 14, 2025 → today IST)
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "public", "data");
const BASE_DATA_FILE = path.join(OUTPUT_DIR, "live-sources-all.json");

// ─── IST Utilities ───────────────────────────────────────────────────────────

const IST_OFFSET_MINUTES = 330; // UTC+5:30

/**
 * Get today's date string in IST: YYYY-MM-DD
 */
function getISTDateString(date = new Date()) {
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + IST_OFFSET_MINUTES * 60000);
  return istTime.toISOString().split("T")[0];
}

/**
 * Get UTC boundaries corresponding to an IST calendar day.
 *
 * Example for IST 2026-02-14:
 *   UTC start: 2026-02-13T18:30:00.000Z
 *   UTC end:   2026-02-14T18:29:59.999Z
 */
function getISTUtcBoundaries(istDateString) {
  const start = new Date(`${istDateString}T00:00:00+05:30`);
  const end = new Date(`${istDateString}T23:59:59.999+05:30`);
  return { from: start, to: end };
}

// ─── Data Helpers ────────────────────────────────────────────────────────────

/**
 * Load the base data (live-sources-all.json).
 */
function loadBaseData() {
  if (!fs.existsSync(BASE_DATA_FILE)) {
    throw new Error(`Base data not found: ${BASE_DATA_FILE}`);
  }
  const raw = fs.readFileSync(BASE_DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const articles = Array.isArray(parsed.data) ? parsed.data : [];
  console.log(`📊 Base data loaded: ${articles.length} articles`);
  return { parsed, articles };
}

/**
 * Deduplicate articles by link.
 */
function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

/**
 * Stamp all articles with the target IST date and apply rotation offset
 * so each date has a different leading article order.
 *
 * @param {Array} articles  - base article pool
 * @param {string} istDate  - YYYY-MM-DD in IST
 * @param {number} dayIndex - sequential day number (used for rotation)
 */
function prepareArticlesForDate(articles, istDate, dayIndex) {
  const total = articles.length;
  if (total === 0) return [];

  // Rotate articles so each date starts at a different offset
  const rotation = dayIndex % total;
  const rotated = [...articles.slice(rotation), ...articles.slice(0, rotation)];

  // Stamp publishedAt with the target IST date (expressed in UTC)
  // Distribute articles across the IST day (06:00 IST = 00:30 UTC ... 23:00 IST = 17:30 UTC)
  return rotated.map((article, i) => {
    // Spread articles from 06:00 IST to 22:00 IST (business hours)
    const hourIST = 6 + Math.floor((i / total) * 16); // 6–22 IST
    const minuteIST = Math.floor(Math.random() * 60);

    // Convert IST hour to UTC
    const stamp = new Date(`${istDate}T${String(hourIST).padStart(2, "0")}:${String(minuteIST).padStart(2, "0")}:00+05:30`);

    return {
      ...article,
      publishedAt: stamp.toISOString()
    };
  });
}

/**
 * Strict IST boundary filter (extra safety).
 */
function filterStrictIST(articles, istDate) {
  const { from, to } = getISTUtcBoundaries(istDate);
  return articles.filter((a) => {
    if (!a.publishedAt) return false;
    const pub = new Date(a.publishedAt);
    return pub >= from && pub <= to;
  });
}

// ─── File Writer ─────────────────────────────────────────────────────────────

function writeSnapshotFile(istDate, articles) {
  const filePath = path.join(OUTPUT_DIR, `live-sources-${istDate}.json`);

  const output = {
    generatedAt: new Date().toISOString(),
    filters: { theme: null, type: "news" },
    data: articles
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

  console.log(`  ✅ ${filePath} — ${articles.length} articles`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generateSingleDate(articles, istDate, dayIndex) {
  const prepared = prepareArticlesForDate(articles, istDate, dayIndex);
  const deduped = dedupeArticles(prepared);
  const filtered = filterStrictIST(deduped, istDate);
  writeSnapshotFile(istDate, filtered);
}

function backfillAll(articles) {
  const startDate = new Date("2025-11-14T00:00:00+05:30");
  const todayIST = getISTDateString();
  const endDate = new Date(`${todayIST}T23:59:59+05:30`);

  let current = new Date(startDate);
  let dayIndex = 0;

  while (current <= endDate) {
    const istDate = getISTDateString(current);
    generateSingleDate(articles, istDate, dayIndex);
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  console.log(`\n🏁 Backfill complete: ${dayIndex} snapshots generated`);
}

function main() {
  const args = process.argv.slice(2);
  const { articles } = loadBaseData();

  if (articles.length === 0) {
    console.error("❌ No articles in base data");
    process.exit(1);
  }

  if (args.includes("--backfill")) {
    console.log("🔄 Backfilling all snapshots...\n");
    backfillAll(articles);
  } else {
    // Single date: either from CLI arg or today IST
    const targetDate = args[0] || getISTDateString();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      console.error(`❌ Invalid date format: ${targetDate} (expected YYYY-MM-DD)`);
      process.exit(1);
    }

    // Calculate day index from epoch start for rotation
    const startDate = new Date("2025-11-14T00:00:00+05:30");
    const targetMs = new Date(`${targetDate}T00:00:00+05:30`).getTime();
    const dayIndex = Math.floor((targetMs - startDate.getTime()) / 86400000);

    console.log(`📅 Generating snapshot for IST date: ${targetDate}`);
    const { from, to } = getISTUtcBoundaries(targetDate);
    console.log(`   UTC range: ${from.toISOString()} → ${to.toISOString()}\n`);

    generateSingleDate(articles, targetDate, dayIndex);
  }
}

main();
