/**
 * V3 image downloader - more robust, uses fetch API (Node 18+)
 * Tries Wikipedia original images and falls back to larger thumbnails.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images");

const MIN_SIZE = 5000; // minimum 5KB to be considered a real image

// Characters still needing images (SVG or too small)
const CHARACTERS = {
  legolas: ["Legolas", "Orlando_Bloom"],
  gimli: ["Gimli_(Middle-earth)", "John_Rhys-Davies"],
  sam: ["Samwise_Gamgee", "Sean_Astin"],
  pippin: ["Peregrin_Took", "Billy_Boyd_(actor)"],
  elrond: ["Elrond", "Hugo_Weaving"],
  eowyn: ["Éowyn", "Miranda_Otto"],
  theoden: ["Théoden", "Bernard_Hill"],
  faramir: ["Faramir", "David_Wenham"],
  denethor: ["Denethor", "John_Noble"],
  thorin: ["Thorin_Oakenshield", "Richard_Armitage"],
  thranduil: ["Thranduil", "Lee_Pace"],
  radagast: ["Radagast_(Middle-earth)", "Sylvester_McCoy"],
  azog: ["Azog"],
  kili: ["Kíli", "Aidan_Turner"],
  fili: ["Fíli", "Dean_O'Gorman"],
  balin: ["Balin_(Middle-earth)", "Ken_Stott"],
  sylvebarbe: ["Treebeard"],
  "roi-sorcier": ["Witch-king_of_Angmar"],
  grima: ["Gríma_Wormtongue", "Brad_Dourif"],
  haldir: ["Haldir_(Middle-earth)", "Craig_Parker"],
  gothmog: ["Gothmog_(Third_Age)"],
  lurtz: ["Lurtz"],
  arachne: ["Shelob"],
  rosie: ["Rosie_Cotton", "Sarah_McLeod"],
  "bouche-de-sauron": ["Mouth_of_Sauron"],
  morgoth: ["Morgoth"],
  luthien: ["Lúthien"],
  beren: ["Beren"],
  turin: ["Túrin_Turambar"],
  // Also re-download small/broken ones
  arwen: ["Arwen", "Liv_Tyler"],
  isildur: ["Isildur"],
  smaug: ["Smaug"],
  boromir: ["Boromir", "Sean_Bean"],
  saroumane: ["Saruman", "Christopher_Lee"],
  frodon: ["Frodo_Baggins", "Elijah_Wood"],
  gamling: ["Gamling"],
};

const HEADERS = {
  "User-Agent": "MordordleBot/1.0 (educational project)",
  Accept: "image/*, application/json, text/html",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}

async function downloadFile(url, outPath) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < MIN_SIZE) return false;
    // Check it's actually image data (JPEG starts with FFD8, PNG with 8950)
    const magic = buffer[0] * 256 + buffer[1];
    if (magic !== 0xffd8 && magic !== 0x8950 && buffer.slice(0, 4).toString() !== "RIFF") {
      // Not JPEG, PNG, or WebP
      return false;
    }
    fs.writeFileSync(outPath, buffer);
    return true;
  } catch {
    return false;
  }
}

// Method 1: Wikipedia REST summary - get originalimage
async function trySummaryAPI(title) {
  const json = await fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!json) return null;
  // Prefer original image (higher quality)
  if (json.originalimage?.source) return json.originalimage.source;
  if (json.thumbnail?.source) {
    // Scale up thumbnail URL
    return json.thumbnail.source.replace(/\/\d+px-/, "/800px-");
  }
  return null;
}

// Method 2: Get the main image (infobox) from Wikipedia page via pageimages API
async function tryPageImage(title) {
  const json = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json`
  );
  if (!json?.query?.pages) return null;
  const page = Object.values(json.query.pages)[0];
  return page?.original?.source || null;
}

// Method 3: Get all images from a page, find the best candidate
async function tryPageAllImages(title) {
  const json = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json`
  );
  if (!json?.query?.pages) return null;
  const page = Object.values(json.query.pages)[0];
  if (!page?.images) return null;

  const candidates = page.images
    .map((i) => i.title)
    .filter((t) => {
      const l = t.toLowerCase();
      return (
        /\.(jpg|jpeg|png|webp)$/i.test(l) &&
        !l.includes("icon") && !l.includes("logo") && !l.includes("flag") &&
        !l.includes("map") && !l.includes("commons-logo") && !l.includes("wiki")
      );
    });

  for (const candidate of candidates.slice(0, 8)) {
    const url = await getFileUrl(candidate);
    if (url) return url;
  }
  return null;
}

// Method 4: Wikimedia Commons search
async function tryCommonsSearch(query) {
  const json = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json`
  );
  if (!json?.query?.search) return null;

  for (const result of json.query.search) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(result.title)) {
      const url = await getFileUrl(result.title, true);
      if (url) return url;
    }
  }
  return null;
}

async function getFileUrl(fileTitle, isCommons = false) {
  const cleanTitle = fileTitle.startsWith("File:") ? fileTitle : `File:${fileTitle}`;
  const domain = isCommons ? "commons.wikimedia.org" : "en.wikipedia.org";
  const json = await fetchJson(
    `https://${domain}/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
  );
  if (!json?.query?.pages) return null;
  const page = Object.values(json.query.pages)[0];
  // Prefer thumb at 800px, fallback to original
  return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
}

function getExt(url) {
  const m = url.match(/\.(jpg|jpeg|png|webp)/i);
  return m ? m[1].toLowerCase() : "jpg";
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(CHARACTERS);
  let ok = 0, fail = 0;

  console.log(`Downloading images for ${entries.length} characters...\n`);

  for (const [id, terms] of entries) {
    // Check if already has a good image
    const existing = ["jpg", "jpeg", "png", "webp"].find((ext) => {
      const p = path.join(OUTPUT_DIR, `${id}.${ext}`);
      return fs.existsSync(p) && fs.statSync(p).size >= MIN_SIZE;
    });
    if (existing) {
      console.log(`  OK ${id} (${existing})`);
      ok++;
      continue;
    }

    process.stdout.write(`  ${id}... `);
    let imageUrl = null;

    for (const term of terms) {
      // Try methods in order of reliability
      imageUrl = await tryPageImage(term);
      if (imageUrl) { console.log(`pageimage[${term}]`); break; }

      imageUrl = await trySummaryAPI(term);
      if (imageUrl) { console.log(`summary[${term}]`); break; }

      imageUrl = await tryPageAllImages(term);
      if (imageUrl) { console.log(`allimages[${term}]`); break; }

      await new Promise((r) => setTimeout(r, 150));
    }

    if (!imageUrl) {
      // Commons search with character name + middle-earth
      for (const q of [`${terms[0]} middle-earth`, `${terms[0]} tolkien`, `${terms[0]} lord of the rings`]) {
        imageUrl = await tryCommonsSearch(q);
        if (imageUrl) { console.log(`commons[${q}]`); break; }
      }
    }

    if (imageUrl) {
      const ext = getExt(imageUrl);
      const outPath = path.join(OUTPUT_DIR, `${id}.${ext}`);
      const success = await downloadFile(imageUrl, outPath);
      if (success) {
        // Remove old SVG
        const svgPath = path.join(OUTPUT_DIR, `${id}.svg`);
        if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
        // Remove other old formats
        for (const e of ["jpg", "jpeg", "png", "webp"]) {
          if (e !== ext) {
            const old = path.join(OUTPUT_DIR, `${id}.${e}`);
            if (fs.existsSync(old) && fs.statSync(old).size < MIN_SIZE) fs.unlinkSync(old);
          }
        }
        ok++;
      } else {
        console.log(`  FAIL download ${id}`);
        fail++;
      }
    } else {
      console.log(`not found`);
      fail++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nResult: ${ok} OK, ${fail} failed`);

  // Update characters.json
  const charsPath = path.join(__dirname, "..", "src", "data", "characters.json");
  const chars = JSON.parse(fs.readFileSync(charsPath, "utf-8"));
  for (const char of chars) {
    for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
      const p = path.join(OUTPUT_DIR, `${char.id}.${ext}`);
      if (fs.existsSync(p) && (ext === "svg" || fs.statSync(p).size >= MIN_SIZE)) {
        char.image = `/images/${char.id}.${ext}`;
        break;
      }
    }
  }
  fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2) + "\n");
  console.log("characters.json updated");
}

main().catch(console.error);
