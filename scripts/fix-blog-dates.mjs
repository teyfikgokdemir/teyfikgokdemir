import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../src/data/blog.ts', import.meta.url);
let source = await readFile(file, 'utf8');

const replacements = [
  ["date: '2026-07-26', updated: '2026-07-26'", "date: '2026-07-23', updated: '2026-07-23'"],
  ["date: '2026-07-27', updated: '2026-07-27'", "date: '2026-07-24', updated: '2026-07-24'"],
];

for (const [from, to] of replacements) {
  source = source.replaceAll(from, to);
}

await writeFile(file, source, 'utf8');
console.log('Normalized blog publication dates.');
