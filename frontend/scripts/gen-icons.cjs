const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "mascot.svg");
const outDir = path.join(__dirname, "..", "public");
fs.mkdirSync(outDir, { recursive: true });

const svg = fs.readFileSync(svgPath);

async function main() {
  for (const size of [192, 512]) {
    const buf = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf);
    console.log(`Wrote icon-${size}.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
