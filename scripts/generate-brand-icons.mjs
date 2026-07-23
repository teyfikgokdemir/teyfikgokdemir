import path from "node:path";
import sharp from "sharp";

const source = process.argv[2];

if (!source) {
  throw new Error("Logo kaynak dosyası verilmedi.");
}

const root = process.cwd();
const background = {
  r: 9,
  g: 17,
  b: 29,
  alpha: 1,
};

const targets = [
  {
    path: "public/favicon-32x32.png",
    size: 32,
    padding: 4,
  },
  {
    path: "public/favicon-192x192.png",
    size: 192,
    padding: 24,
  },
  {
    path: "public/favicon-512x512.png",
    size: 512,
    padding: 64,
  },
  {
    path: "public/apple-touch-icon.png",
    size: 180,
    padding: 22,
  },
];

for (const target of targets) {
  const innerSize = target.size - target.padding * 2;

  const logo = await sharp(source)
    .resize({
      width: innerSize,
      height: innerSize,
      fit: "contain",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: target.size,
      height: target.size,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: logo,
        gravity: "centre",
      },
    ])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(path.join(root, target.path));

  console.log(`${target.path}: ${target.size}x${target.size}`);
}