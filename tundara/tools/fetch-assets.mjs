/**
 * Tundara asset fetcher (dev utility).
 * Downloads the demo product photography into assets/img so the store
 * works fully offline. Run once:  node tools/fetch-assets.mjs
 */
import { readFile, mkdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(await readFile(join(root, "assets/data/source-products.json"), "utf8"));
const productDir = join(root, "assets/img/products");
const lifeDir = join(root, "assets/img/lifestyle");
await mkdir(productDir, { recursive: true });
await mkdir(lifeDir, { recursive: true });

const EXCLUDED = new Set(["vehicle", "motorcycle"]);
const pool = source.products.filter((p) => !EXCLUDED.has(p.category));

const lifestyle = {
  "store.jpg": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80&auto=format&fit=crop",
  "shopping-bags.jpg": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80&auto=format&fit=crop",
  "fashion.jpg": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80&auto=format&fit=crop",
  "tech.jpg": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80&auto=format&fit=crop",
  "headphones.jpg": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop",
  "sneaker.jpg": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop",
  "kitchen.jpg": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop",
  "beauty.jpg": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80&auto=format&fit=crop",
  "living.jpg": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop",
  "grocery.jpg": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop",
  "sale.jpg": "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&q=80&auto=format&fit=crop",
  "delivery.jpg": "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=80&auto=format&fit=crop",
  "payment.jpg": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80&auto=format&fit=crop",
  "perfume.jpg": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1200&q=80&auto=format&fit=crop",
  "skincare.jpg": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&q=80&auto=format&fit=crop",
  "shoes.jpg": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
  "bags.jpg": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80&auto=format&fit=crop",
  "watch.jpg": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
  "laptop.jpg": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80&auto=format&fit=crop",
  "phone.jpg": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
};

const jobs = [];
for (const p of pool) {
  jobs.push({ url: p.thumbnail, file: join(productDir, `${p.id}-thumb.webp`) });
  for (let i = 0; i < 4; i++) {
    const url = p.images[i] || p.images[0] || p.thumbnail;
    jobs.push({ url, file: join(productDir, `${p.id}-${i + 1}.webp`) });
  }
}
for (const [name, url] of Object.entries(lifestyle)) {
  jobs.push({ url, file: join(lifeDir, name) });
}

let done = 0, skipped = 0, failed = 0, bytes = 0;
const failures = [];

async function download(job) {
  if (existsSync(job.file)) {
    skipped++;
    bytes += (await stat(job.file)).size;
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(job.url, { headers: { "user-agent": "TundaraDemo/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) throw new Error("empty response");
      await writeFile(job.file, buf);
      done++;
      bytes += buf.length;
      return;
    } catch (err) {
      if (attempt === 3) {
        failed++;
        failures.push(`${job.file.split(/[\\/]/).pop()}: ${err.message}`);
      } else {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
}

const queue = [...jobs];
const workers = Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    await download(job);
    const total = done + skipped + failed;
    if (total % 100 === 0) console.log(`  ${total}/${jobs.length} processed…`);
  }
});

await Promise.all(workers);
console.log(`\nDone. downloaded=${done} skipped=${skipped} failed=${failed} size=${(bytes / 1024 / 1024).toFixed(1)}MB`);
if (failures.length) console.log("Failures:\n" + failures.join("\n"));
