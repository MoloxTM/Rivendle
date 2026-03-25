import fs from "fs";

const HEADERS = { "User-Agent": "MordordleBot/1.0 (educational project)" };

// Test a few specific characters
const tests = [
  { id: "legolas", title: "Legolas" },
  { id: "sam", title: "Samwise_Gamgee" },
  { id: "eowyn", title: "Éowyn" },
  { id: "arwen", title: "Arwen" },
];

for (const { id, title } of tests) {
  console.log(`\n=== ${id} (${title}) ===`);

  // Method: pageimages with original
  const url1 = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json`;
  const r1 = await (await fetch(url1, { headers: HEADERS })).json();
  const page1 = Object.values(r1.query.pages)[0];
  console.log("pageimage original:", page1?.original?.source?.substring(0, 120) || "none");

  // Method: summary
  const url2 = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const r2 = await (await fetch(url2, { headers: HEADERS })).json();
  console.log("summary original:", r2?.originalimage?.source?.substring(0, 120) || "none");
  console.log("summary thumb:", r2?.thumbnail?.source?.substring(0, 120) || "none");

  // Try downloading the first available URL
  const imgUrl = page1?.original?.source || r2?.originalimage?.source;
  if (imgUrl) {
    console.log("Trying download:", imgUrl.substring(0, 120));
    const res = await fetch(imgUrl, { headers: HEADERS, redirect: "follow" });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    console.log("Content-Length:", res.headers.get("content-length"));
    const buf = Buffer.from(await res.arrayBuffer());
    console.log("Buffer size:", buf.length);
    console.log("First bytes (hex):", buf.slice(0, 8).toString("hex"));
    console.log("First bytes (ascii):", buf.slice(0, 20).toString("ascii").replace(/[^\x20-\x7e]/g, "."));
  }
}
