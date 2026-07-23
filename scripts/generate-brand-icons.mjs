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
  {
    output: "public/favicon-32x32.png",
    size: 32,
    padding: 3,
  },
  {
    output: "public/favicon-48x48.png",
    size: 48,
    padding: 5,
  },
  {
    output: "public/favicon-192x192.png",
    size: 192,
    padding: 22,
  },
  {
    output: "public/favicon-512x512.png",
    size: 512,
    padding: 56,
  },
  {
    output: "public/apple-touch-icon.png",
    size: 180,
    padding: 20,
  },
];

for (const target of targets) {
  const inner = target.size - target.padding * 2;

  const logo = await sharp(source, {
    density: 600,
  })
    .resize({
      width: inner,
      height: inner,
      fit: "contain",
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
    .toFile(path.join(root, target.output));

  console.log(
    `${target.output}: ${target.size}x${target.size}`
  );
}