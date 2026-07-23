import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imageDirectory = path.join(root, 'public', 'images');

const jobs = [
  {
    source: 'teyfik-gokdemir-founder.webp',
    variants: [
      {
        filename: 'teyfik-gokdemir-founder-480.webp',
        width: 480,
      },
      {
        filename: 'teyfik-gokdemir-founder-720.webp',
        width: 720,
      },
    ],
  },
  {
    source: 'teyfik-gokdemir-profile.webp',
    variants: [
      {
        filename: 'teyfik-gokdemir-profile-480.webp',
        width: 480,
      },
      {
        filename: 'teyfik-gokdemir-profile-720.webp',
        width: 720,
      },
      {
        filename: 'teyfik-gokdemir-profile-960.webp',
        width: 960,
      },
    ],
  },
];

for (const job of jobs) {
  const sourcePath = path.join(imageDirectory, job.source);

  await fs.access(sourcePath);

  for (const variant of job.variants) {
    const outputPath = path.join(
      imageDirectory,
      variant.filename
    );

    await sharp(sourcePath)
      .resize({
        width: variant.width,
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 6,
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    console.log(
      `${variant.filename}: ` +
      `${metadata.width}x${metadata.height}`
    );
  }
}