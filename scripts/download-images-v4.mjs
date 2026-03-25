/**
 * V4 - Handles rate limiting with retries + longer delays
 * Focuses on Commons for fictional characters, actors for film characters
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images");
const MIN_SIZE = 5000;

const HEADERS = {
  "User-Agent": "MordordleBot/1.0 (educational-game; contact@mordordle.com)",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, binary = false, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (res.status === 429) {
        const wait = (i + 1) * 5000;
        console.log(`    429 rate limited, waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) return null;
      if (binary) {
        const buf = Buffer.from(await res.arrayBuffer());
        return buf;
      }
      return await res.json();
    } catch {
      await sleep(2000);
    }
  }
  return null;
}

// Get image URL from Wikipedia pageimages API (infobox image)
async function getPageImage(title) {
  const json = await fetchWithRetry(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json`
  );
  if (!json?.query?.pages) return null;
  const page = Object.values(json.query.pages)[0];
  return page?.original?.source || null;
}

// Get image from summary API
async function getSummaryImage(title) {
  const json = await fetchWithRetry(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!json) return null;
  return json?.originalimage?.source || json?.thumbnail?.source?.replace(/\/\d+px-/, "/600px-") || null;
}

// Search Wikimedia Commons
async function searchCommons(query) {
  const json = await fetchWithRetry(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json`
  );
  if (!json?.query?.search) return [];
  return json.query.search
    .filter((r) => /\.(jpg|jpeg|png|webp)$/i.test(r.title))
    .map((r) => r.title);
}

// Get direct URL for a Commons file
async function getCommonsUrl(fileTitle) {
  const clean = fileTitle.startsWith("File:") ? fileTitle : `File:${fileTitle}`;
  const json = await fetchWithRetry(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(clean)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json`
  );
  if (!json?.query?.pages) return null;
  const page = Object.values(json.query.pages)[0];
  return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
}

function isImage(buf) {
  if (!buf || buf.length < MIN_SIZE) return false;
  // JPEG: FF D8
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  // PNG: 89 50
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  // WebP: RIFF...WEBP
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return true;
  return false;
}

function getExt(url) {
  if (url.includes(".png")) return "png";
  if (url.includes(".webp")) return "webp";
  return "jpg";
}

async function tryDownload(url) {
  if (!url) return null;
  const buf = await fetchWithRetry(url, true);
  if (isImage(buf)) return { buf, ext: getExt(url) };
  return null;
}

// Characters that need images - with search strategies
const CHARACTERS = [
  // Film characters - try actor photos as they're freely available
  { id: "legolas", wiki: ["Legolas"], actors: ["Orlando_Bloom"], commons: ["Legolas lord of the rings"] },
  { id: "gimli", wiki: ["Gimli_(Middle-earth)"], actors: ["John_Rhys-Davies"], commons: ["Gimli dwarf"] },
  { id: "sam", wiki: ["Samwise_Gamgee"], actors: ["Sean_Astin"], commons: ["Samwise Gamgee"] },
  { id: "pippin", wiki: ["Peregrin_Took"], actors: ["Billy_Boyd_(actor)"], commons: ["Peregrin Took"] },
  { id: "elrond", wiki: ["Elrond"], actors: ["Hugo_Weaving"], commons: ["Elrond"] },
  { id: "eowyn", wiki: ["Éowyn"], actors: ["Miranda_Otto"], commons: ["Eowyn"] },
  { id: "theoden", wiki: ["Théoden"], actors: ["Bernard_Hill_(actor)"], commons: ["Theoden"] },
  { id: "faramir", wiki: ["Faramir"], actors: ["David_Wenham"], commons: ["Faramir"] },
  { id: "denethor", wiki: ["Denethor"], actors: ["John_Noble"], commons: ["Denethor"] },
  { id: "thorin", wiki: ["Thorin_Oakenshield"], actors: ["Richard_Armitage"], commons: ["Thorin Oakenshield"] },
  { id: "thranduil", wiki: ["Thranduil"], actors: ["Lee_Pace"], commons: ["Thranduil"] },
  { id: "radagast", wiki: ["Radagast_(Middle-earth)"], actors: ["Sylvester_McCoy"], commons: ["Radagast"] },
  { id: "azog", wiki: ["Azog"], actors: [], commons: ["Azog"] },
  { id: "kili", wiki: ["Kíli"], actors: ["Aidan_Turner"], commons: ["Kili dwarf hobbit"] },
  { id: "fili", wiki: ["Fíli"], actors: ["Dean_O'Gorman"], commons: ["Fili dwarf hobbit"] },
  { id: "balin", wiki: ["Balin_(Middle-earth)"], actors: ["Ken_Stott"], commons: ["Balin dwarf"] },
  { id: "sylvebarbe", wiki: ["Treebeard"], actors: [], commons: ["Treebeard", "Treebeard ent"] },
  { id: "roi-sorcier", wiki: ["Witch-king_of_Angmar"], actors: [], commons: ["Witch-king Angmar"] },
  { id: "grima", wiki: ["Gríma_Wormtongue"], actors: ["Brad_Dourif"], commons: ["Grima Wormtongue"] },
  { id: "haldir", wiki: ["Haldir_(Middle-earth)"], actors: ["Craig_Parker"], commons: ["Haldir elf"] },
  { id: "gothmog", wiki: ["Gothmog_(Third_Age)"], actors: [], commons: ["Gothmog orc"] },
  { id: "lurtz", wiki: ["Lurtz"], actors: [], commons: ["Lurtz uruk-hai"] },
  { id: "arachne", wiki: ["Shelob"], actors: [], commons: ["Shelob spider"] },
  { id: "rosie", wiki: ["Rosie_Cotton"], actors: ["Sarah_McLeod"], commons: ["Rosie Cotton"] },
  { id: "bouche-de-sauron", wiki: ["Mouth_of_Sauron"], actors: [], commons: ["Mouth of Sauron"] },
  { id: "morgoth", wiki: ["Morgoth"], actors: [], commons: ["Morgoth Melkor", "Morgoth tolkien"] },
  { id: "luthien", wiki: ["Lúthien"], actors: [], commons: ["Luthien tolkien", "Luthien Tinuviel"] },
  { id: "beren", wiki: ["Beren"], actors: [], commons: ["Beren tolkien", "Beren Luthien"] },
  { id: "turin", wiki: ["Túrin_Turambar"], actors: [], commons: ["Turin Turambar tolkien"] },
  // Re-download broken/small images
  { id: "arwen", wiki: ["Arwen"], actors: ["Liv_Tyler"], commons: ["Arwen tolkien"] },
  { id: "isildur", wiki: ["Isildur"], actors: [], commons: ["Isildur"] },
  { id: "smaug", wiki: ["Smaug"], actors: [], commons: ["Smaug dragon"] },
  { id: "gamling", wiki: ["Gamling"], actors: [], commons: ["Gamling rohan"] },
];

async function processCharacter(char) {
  // Check existing
  const existing = ["jpg", "jpeg", "png", "webp"].find((ext) => {
    const p = path.join(OUTPUT_DIR, `${char.id}.${ext}`);
    return fs.existsSync(p) && fs.statSync(p).size >= MIN_SIZE;
  });
  if (existing) {
    console.log(`  OK ${char.id}`);
    return true;
  }

  process.stdout.write(`  ${char.id}... `);

  // Strategy 1: Wikipedia pageimages (character page)
  for (const title of char.wiki) {
    const url = await getPageImage(title);
    const result = await tryDownload(url);
    if (result) {
      saveImage(char.id, result);
      console.log(`wiki[${title}]`);
      return true;
    }
    await sleep(1000);
  }

  // Strategy 2: Wikipedia summary (character page)
  for (const title of char.wiki) {
    const url = await getSummaryImage(title);
    const result = await tryDownload(url);
    if (result) {
      saveImage(char.id, result);
      console.log(`summary[${title}]`);
      return true;
    }
    await sleep(1000);
  }

  // Strategy 3: Actor Wikipedia pages
  for (const actor of char.actors) {
    const url = await getPageImage(actor) || await getSummaryImage(actor);
    const result = await tryDownload(url);
    if (result) {
      saveImage(char.id, result);
      console.log(`actor[${actor}]`);
      return true;
    }
    await sleep(1000);
  }

  // Strategy 4: Wikimedia Commons search
  for (const query of char.commons) {
    const files = await searchCommons(query);
    for (const file of files.slice(0, 3)) {
      const url = await getCommonsUrl(file);
      const result = await tryDownload(url);
      if (result) {
        saveImage(char.id, result);
        console.log(`commons[${query}]`);
        return true;
      }
      await sleep(500);
    }
    await sleep(1000);
  }

  console.log("FAILED");
  return false;
}

function saveImage(id, { buf, ext }) {
  const outPath = path.join(OUTPUT_DIR, `${id}.${ext}`);
  fs.writeFileSync(outPath, buf);
  // Clean up old files
  const svgPath = path.join(OUTPUT_DIR, `${id}.svg`);
  if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
  for (const e of ["jpg", "jpeg", "png", "webp"]) {
    if (e !== ext) {
      const old = path.join(OUTPUT_DIR, `${id}.${e}`);
      if (fs.existsSync(old) && fs.statSync(old).size < MIN_SIZE) fs.unlinkSync(old);
    }
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let ok = 0, fail = 0;
  console.log(`Processing ${CHARACTERS.length} characters...\n`);

  for (const char of CHARACTERS) {
    const success = await processCharacter(char);
    if (success) ok++; else fail++;
    await sleep(1500); // Be nice to Wikipedia
  }

  console.log(`\n${ok} OK, ${fail} failed\n`);

  // Update characters.json
  const charsPath = path.join(__dirname, "..", "src", "data", "characters.json");
  const chars = JSON.parse(fs.readFileSync(charsPath, "utf-8"));
  for (const char of chars) {
    for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
      const p = path.join(OUTPUT_DIR, `${char.id}.${ext}`);
      if (fs.existsSync(p)) {
        char.image = `/images/${char.id}.${ext}`;
        break;
      }
    }
  }
  fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2) + "\n");
  console.log("characters.json updated");
}

main().catch(console.error);
