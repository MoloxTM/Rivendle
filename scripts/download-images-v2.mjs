/**
 * Enhanced image downloader for Mordordle characters.
 * Tries multiple Wikipedia API methods to find images.
 *
 * Usage: node scripts/download-images-v2.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images");

// Only characters that still have SVG placeholders
const MISSING = {
  aragorn: ["Aragorn", "Viggo_Mortensen"],
  frodon: ["Frodo_Baggins", "Elijah_Wood"],
  legolas: ["Legolas", "Orlando_Bloom"],
  gimli: ["Gimli_(Middle-earth)", "John_Rhys-Davies"],
  sam: ["Samwise_Gamgee", "Sean_Astin"],
  pippin: ["Peregrin_Took", "Billy_Boyd_(actor)"],
  merry: ["Meriadoc_Brandybuck", "Dominic_Monaghan"],
  boromir: ["Boromir", "Sean_Bean"],
  saroumane: ["Saruman", "Christopher_Lee"],
  galadriel: ["Galadriel", "Cate_Blanchett"],
  elrond: ["Elrond", "Hugo_Weaving"],
  eowyn: ["Éowyn", "Miranda_Otto"],
  theoden: ["Théoden", "Bernard_Hill"],
  eomer: ["Éomer", "Karl_Urban"],
  faramir: ["Faramir", "David_Wenham"],
  denethor: ["Denethor", "John_Noble"],
  thorin: ["Thorin_Oakenshield", "Richard_Armitage"],
  thranduil: ["Thranduil", "Lee_Pace"],
  bard: ["Bard_the_Bowman", "Luke_Evans"],
  radagast: ["Radagast_(Middle-earth)", "Sylvester_McCoy"],
  azog: ["Azog"],
  kili: ["Kíli", "Aidan_Turner"],
  fili: ["Fíli", "Dean_O%27Gorman"],
  balin: ["Balin_(Middle-earth)", "Ken_Stott"],
  sylvebarbe: ["Treebeard"],
  "roi-sorcier": ["Witch-king_of_Angmar"],
  grima: ["Gríma_Wormtongue", "Brad_Dourif"],
  haldir: ["Haldir_(Middle-earth)", "Craig_Parker"],
  celeborn: ["Celeborn", "Marton_Csokas"],
  gothmog: ["Gothmog_(Third_Age)"],
  lurtz: ["Lurtz"],
  arachne: ["Shelob"],
  glorfindel: ["Glorfindel"],
  halbrand: ["Halbrand", "Charlie_Vickers_(actor)"],
  nori: ["Nori_Brandyfoot", "Markella_Kavenagh"],
  arondir: ["Arondir", "Ismael_Cruz_Córdova"],
  rosie: ["Rosie_Cotton", "Sarah_McLeod"],
  "bouche-de-sauron": ["Mouth_of_Sauron"],
  morgoth: ["Morgoth"],
  luthien: ["Lúthien"],
  beren: ["Beren"],
  turin: ["Túrin_Turambar"],
};

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, { headers: { "User-Agent": "MordordleBot/1.0 (educational game project; contact: dev)" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpGet(res.headers.location).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (res.headers["content-type"]?.includes("json") || res.headers["content-type"]?.includes("text")) {
            try {
              resolve({ json: JSON.parse(buf.toString()), buffer: buf, type: res.headers["content-type"] });
            } catch {
              resolve({ json: null, buffer: buf, type: res.headers["content-type"] });
            }
          } else {
            resolve({ json: null, buffer: buf, type: res.headers["content-type"] });
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// Method 1: Wikipedia REST API summary (thumbnail)
async function tryWikiSummary(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const { json } = await httpGet(url);
    if (json?.originalimage?.source) {
      return json.originalimage.source;
    }
    if (json?.thumbnail?.source) {
      // Get bigger version
      return json.thumbnail.source.replace(/\/\d+px-/, "/500px-");
    }
  } catch {}
  return null;
}

// Method 2: Wikipedia API - get all images from a page and pick the best one
async function tryWikiPageImages(title) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json`;
    const { json } = await httpGet(url);
    const pages = json?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page?.images) return null;

    // Filter for likely character images (not icons, logos, etc.)
    const candidates = page.images
      .map((img) => img.title)
      .filter((t) => {
        const lower = t.toLowerCase();
        return (
          (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp")) &&
          !lower.includes("icon") &&
          !lower.includes("logo") &&
          !lower.includes("flag") &&
          !lower.includes("map") &&
          !lower.includes("commons") &&
          !lower.includes("wiki")
        );
      });

    // Try each candidate
    for (const candidate of candidates.slice(0, 5)) {
      const imgUrl = await getCommonsImageUrl(candidate);
      if (imgUrl) return imgUrl;
    }
  } catch {}
  return null;
}

// Method 3: Wikimedia Commons direct search
async function tryCommonsSearch(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " tolkien OR lotr OR hobbit")}&srnamespace=6&srlimit=5&format=json`;
    const { json } = await httpGet(url);
    const results = json?.query?.search;
    if (!results?.length) return null;

    for (const result of results) {
      const title = result.title;
      if (title.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const imgUrl = await getCommonsImageUrl(title);
        if (imgUrl) return imgUrl;
      }
    }
  } catch {}
  return null;
}

// Get actual image URL from a Wikimedia Commons file title
async function getCommonsImageUrl(fileTitle) {
  try {
    const cleanTitle = fileTitle.startsWith("File:") ? fileTitle : `File:${fileTitle}`;
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json`;
    const { json } = await httpGet(url);
    const pages = json?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
  } catch {}
  return null;
}

async function downloadImage(url, outputPath) {
  try {
    const { buffer, type } = await httpGet(url);
    if (buffer && buffer.length > 1000) {
      // Verify it's actually an image
      if (type && !type.includes("image") && !type.includes("octet")) {
        return false;
      }
      fs.writeFileSync(outputPath, buffer);
      return true;
    }
  } catch {}
  return false;
}

function getExtFromUrl(url) {
  const match = url.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(MISSING);
  let downloaded = 0;
  let failed = 0;

  console.log(`Attempting to download images for ${entries.length} characters...\n`);

  for (const [id, searchTerms] of entries) {
    // Skip if already has a non-SVG image
    const existing = ["jpg", "jpeg", "png", "webp"].find((ext) =>
      fs.existsSync(path.join(OUTPUT_DIR, `${id}.${ext}`))
    );
    if (existing) {
      console.log(`✓ ${id} - already has .${existing}`);
      downloaded++;
      continue;
    }

    console.log(`→ ${id}...`);
    let imageUrl = null;

    // Try each search term with multiple methods
    for (const term of searchTerms) {
      // Method 1: Summary API
      imageUrl = await tryWikiSummary(term);
      if (imageUrl) {
        console.log(`  Found via summary: ${term}`);
        break;
      }

      // Method 2: Page images
      imageUrl = await tryWikiPageImages(term);
      if (imageUrl) {
        console.log(`  Found via page images: ${term}`);
        break;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    // Method 3: Commons search as fallback
    if (!imageUrl) {
      imageUrl = await tryCommonsSearch(id.replace(/-/g, " "));
      if (imageUrl) console.log(`  Found via Commons search`);
    }

    if (imageUrl) {
      const ext = getExtFromUrl(imageUrl);
      const outPath = path.join(OUTPUT_DIR, `${id}.${ext}`);
      const success = await downloadImage(imageUrl, outPath);
      if (success) {
        // Remove old SVG placeholder
        const svgPath = path.join(OUTPUT_DIR, `${id}.svg`);
        if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
        console.log(`  ✓ Downloaded ${id}.${ext}`);
        downloaded++;
      } else {
        console.log(`  ✗ Download failed`);
        failed++;
      }
    } else {
      console.log(`  ✗ No image found`);
      failed++;
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone! ${downloaded} downloaded, ${failed} failed.`);

  // Update characters.json
  console.log("\nUpdating characters.json...");
  const charsPath = path.join(__dirname, "..", "src", "data", "characters.json");
  const chars = JSON.parse(fs.readFileSync(charsPath, "utf-8"));

  for (const char of chars) {
    for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
      if (fs.existsSync(path.join(OUTPUT_DIR, `${char.id}.${ext}`))) {
        char.image = `/images/${char.id}.${ext}`;
        break;
      }
    }
  }

  fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2) + "\n");
  console.log("✓ characters.json updated");
}

main().catch(console.error);
