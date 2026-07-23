import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const sourcePath = path.join(
  root,
  "public",
  "images",
  "teyfik-gokdemir-tg-logo.png"
);

const transparentPath = path.join(
  root,
  "public",
  "images",
  "teyfik-gokdemir-tg-logo-transparent.png"
);

const source = sharp(sourcePath).ensureAlpha();

const {
  data,
  info,
} = await source
  .raw()
  .toBuffer({
    resolveWithObject: true,
  });

const output = Buffer.alloc(data.length);

/*
 * Kaynak görseldeki lacivert/siyah zemini alfa kanalına çevirir.
 * Altın monogramı ve kenar yumuşatmalarını korur.
 */
const background = {
  r: 4,
  g: 15,
  b: 27,
};

for (let index = 0; index < data.length; index += 4) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];

  const distance = Math.sqrt(
    Math.pow(r - background.r, 2) +
    Math.pow(g - background.g, 2) +
    Math.pow(b - background.b, 2)
  );

  let alpha = Math.round(
    Math.max(
      0,
      Math.min(
        255,
        ((distance - 5) / 55) * 255
      )
    )
  );

  /*
   * Çok koyu ve nötr pikselleri tamamen temizle.
   * Altın/kahverengi kenarlara dokunma.
   */
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const saturation = maximum - minimum;

  if (maximum < 45 && saturation < 20) {
    alpha = 0;
  }

  output[index] = r;
  output[index + 1] = g;
  output[index + 2] = b;
  output[index + 3] = alpha;
}

await sharp(
  output,
  {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  }
)
  .trim({
    background: {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0,
    },
  })
  .png({
    compressionLevel: 9,
    adaptiveFiltering: true,
  })
  .toFile(transparentPath);

console.log(
  "Şeffaf logo oluşturuldu:",
  transparentPath
);

const faviconTargets = [
  {
    output: "public/favicon-32x32.png",
    size: 32,
    padding: 2,
  },
  {
    output: "public/favicon-48x48.png",
    size: 48,
    padding: 4,
  },
  {
    output: "public/favicon-192x192.png",
    size: 192,
    padding: 18,
  },
  {
    output: "public/favicon-512x512.png",
    size: 512,
    padding: 46,
  },
  {
    output: "public/apple-touch-icon.png",
    size: 180,
    padding: 17,
  },
];

for (const target of faviconTargets) {
  const innerSize =
    target.size - target.padding * 2;

  const resizedLogo = await sharp(transparentPath)
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
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    },
  })
    .composite([
      {
        input: resizedLogo,
        gravity: "centre",
      },
    ])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toFile(
      path.join(root, target.output)
    );

  console.log(
    `${target.output}: ${target.size}x${target.size}`
  );
}