import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(
  __dirname,
  "../features/team/assets/competition-logo-white.png",
);

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r < 40 && g < 40 && b < 40) {
    data[i + 3] = 0;
  } else {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }
}

const tmp = src.replace(/\.png$/, "-transparent.png");

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(tmp);

const { renameSync, unlinkSync } = await import("node:fs");
try {
  unlinkSync(src);
} catch {
  /* original may be locked; overwrite via rename */
}
renameSync(tmp, src);

console.log(`transparent PNG saved: ${info.width}x${info.height}`);
