/**
 * Script to download character images from Wikipedia/Wikimedia Commons.
 * Uses the Wikipedia API to find character page images.
 *
 * Usage: node scripts/download-images.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images");

// Map character IDs to their Wikipedia page titles (English Wikipedia has better image coverage)
const CHARACTER_WIKI_MAP = {
  aragorn: "Aragorn",
  gandalf: "Gandalf",
  frodon: "Frodo_Baggins",
  legolas: "Legolas",
  gimli: "Gimli_(Middle-earth)",
  sam: "Samwise_Gamgee",
  pippin: "Peregrin_Took",
  merry: "Meriadoc_Brandybuck",
  boromir: "Boromir",
  gollum: "Gollum",
  sauron: "Sauron",
  saroumane: "Saruman",
  galadriel: "Galadriel",
  elrond: "Elrond",
  arwen: "Arwen",
  eowyn: "Éowyn",
  theoden: "Théoden",
  eomer: "Éomer",
  faramir: "Faramir",
  denethor: "Denethor",
  bilbon: "Bilbo_Baggins",
  thorin: "Thorin_Oakenshield",
  thranduil: "Thranduil",
  smaug: "Smaug",
  bard: "Bard_the_Bowman",
  radagast: "Radagast_(Middle-earth)",
  azog: "Azog",
  tauriel: "Tauriel",
  kili: "Kíli",
  fili: "Fíli",
  balin: "Balin_(Middle-earth)",
  sylvebarbe: "Treebeard",
  "roi-sorcier": "Witch-king_of_Angmar",
  grima: "Gríma_Wormtongue",
  haldir: "Haldir_(Middle-earth)",
  celeborn: "Celeborn",
  gothmog: "Gothmog_(Third_Age)",
  lurtz: "Lurtz",
  arachne: "Shelob",
  "tom-bombadil": "Tom_Bombadil",
  feanor: "Fëanor",
  morgoth: "Morgoth",
  luthien: "Lúthien",
  beren: "Beren",
  turin: "Túrin_Turambar",
  fingolfin: "Fingolfin",
  glorfindel: "Glorfindel",
  halbrand: "The_Rings_of_Power_(season_1)",
  nori: "The_Rings_of_Power_(season_1)",
  "durin-iv": "Durin",
  arondir: "The_Rings_of_Power_(season_1)",
  isildur: "Isildur",
  rosie: "Samwise_Gamgee",
  gamling: "Gamling",
  "bouche-de-sauron": "Mouth_of_Sauron",
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, { headers: { "User-Agent": "MordordleBot/1.0 (game project)" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetch(res.headers.location).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          if (res.headers["content-type"]?.includes("json")) {
            resolve({ json: JSON.parse(Buffer.concat(chunks).toString()), buffer: null });
          } else {
            resolve({ json: null, buffer: Buffer.concat(chunks) });
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function getWikipediaImage(pageTitle) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  try {
    const { json } = await fetch(apiUrl);
    if (json?.thumbnail?.source) {
      // Get a larger version by modifying the thumbnail URL
      let imgUrl = json.thumbnail.source;
      // Try to get 400px version
      imgUrl = imgUrl.replace(/\/\d+px-/, "/400px-");
      return imgUrl;
    }
  } catch (e) {
    console.error(`  Failed to get wiki summary for ${pageTitle}: ${e.message}`);
  }
  return null;
}

async function downloadImage(url, outputPath) {
  try {
    const { buffer } = await fetch(url);
    if (buffer && buffer.length > 0) {
      fs.writeFileSync(outputPath, buffer);
      return true;
    }
  } catch (e) {
    console.error(`  Download failed: ${e.message}`);
  }
  return false;
}

// Generate an SVG placeholder for characters without images
function generatePlaceholder(id, name) {
  const colors = [
    "#8b0000", "#c9a84c", "#2d5016", "#1a3a5c", "#4a1a6b",
    "#6b3a1a", "#1a4a4a", "#3a1a1a", "#4a4a1a", "#1a1a4a",
  ];
  const color = colors[id.charCodeAt(0) % colors.length];
  const initials = name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}"/>
  <text x="200" y="200" font-family="serif" font-size="120" fill="#e8e8e8" text-anchor="middle" dominant-baseline="central">${initials}</text>
  <text x="200" y="320" font-family="sans-serif" font-size="24" fill="#e8e8e880" text-anchor="middle">${name}</text>
</svg>`;
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(CHARACTER_WIKI_MAP);
  let downloaded = 0;
  let placeholders = 0;

  console.log(`Downloading images for ${entries.length} characters...\n`);

  for (const [id, wikiTitle] of entries) {
    const webpPath = path.join(OUTPUT_DIR, `${id}.webp`);
    const pngPath = path.join(OUTPUT_DIR, `${id}.png`);
    const jpgPath = path.join(OUTPUT_DIR, `${id}.jpg`);
    const svgPath = path.join(OUTPUT_DIR, `${id}.svg`);

    // Skip if already have an image
    if (fs.existsSync(webpPath) || fs.existsSync(pngPath) || fs.existsSync(jpgPath)) {
      console.log(`✓ ${id} - already exists, skipping`);
      downloaded++;
      continue;
    }

    console.log(`→ ${id} (${wikiTitle})...`);

    const imageUrl = await getWikipediaImage(wikiTitle);

    if (imageUrl) {
      const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|svg)/i)?.[1] || "jpg";
      const outPath = path.join(OUTPUT_DIR, `${id}.${ext}`);

      const success = await downloadImage(imageUrl, outPath);
      if (success) {
        console.log(`  ✓ Downloaded (${ext})`);
        downloaded++;
        // Small delay to be nice to Wikipedia
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }

    // Fallback: generate SVG placeholder
    console.log(`  ⚠ No image found, generating placeholder`);
    const charName = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    fs.writeFileSync(svgPath, generatePlaceholder(id, charName));
    placeholders++;

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone! ${downloaded} downloaded, ${placeholders} placeholders generated.`);
  console.log(`Images are in: ${OUTPUT_DIR}`);

  // Update characters.json image extensions based on what was actually downloaded
  console.log("\nUpdating characters.json with correct image extensions...");
  const charsPath = path.join(__dirname, "..", "src", "data", "characters.json");
  const chars = JSON.parse(fs.readFileSync(charsPath, "utf-8"));

  for (const char of chars) {
    const id = char.id;
    for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
      if (fs.existsSync(path.join(OUTPUT_DIR, `${id}.${ext}`))) {
        char.image = `/images/${id}.${ext}`;
        break;
      }
    }
  }

  fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2) + "\n");
  console.log("✓ characters.json updated");
}

main().catch(console.error);
