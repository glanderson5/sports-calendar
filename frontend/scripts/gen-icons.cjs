const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeIcon(size, bg, fg) {
  const png = new PNG({ width: size, height: size });
  const [br, bgc, bb] = hexToRgb(bg);
  const [fr, fgc, fb] = hexToRgb(fg);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= r * r;
      const [cr, cg, cb] = inCircle ? [fr, fgc, fb] : [br, bgc, bb];
      png.data[idx] = cr;
      png.data[idx + 1] = cg;
      png.data[idx + 2] = cb;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

const outDir = path.join(__dirname, "..", "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "icon-192.png"), makeIcon(192, "#132257", "#E10600"));
fs.writeFileSync(path.join(outDir, "icon-512.png"), makeIcon(512, "#132257", "#E10600"));
console.log("Wrote icon-192.png and icon-512.png to public/");
