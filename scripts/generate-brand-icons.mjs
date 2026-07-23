import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const source = path.join(
  root,
  "public",
  "images",
  "teyfik-gokdemir-monogram.svg"
);

const background = {
  r: 5,
  g: 16,
  b: 29,
  alpha: 1,
};

const targets = [
  ["public/favicon-32x32.png", 32, 3],
  ["public/favicon-48x48.png", 48, 5],
  ["public/favicon-192x192.png", 192, 20],
  ["public/favicon-512x512.png", 512, 54],
  ["public/apple-touch-icon.png", 180, 19],
];

for (const [output, size, padding] of targets) {
  const innerSize = size - padding * 2;

  const logo = await sharp(source, {
    density: 900,
  })
    .resize({
      width: innerSize,
      height: innerSize,
      fit: "contain",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
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
    .toFile(path.join(root, output));

  console.log(`${output}: ${size}x${size}`);
}