import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'assets', 'icon-corail.png');
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
const cream = { r: 250, g: 244, b: 233, alpha: 1 };

const densities = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 },
};

function roundedMask(size) {
  const radius = Math.round(size * 0.22);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
  );
}

function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
}

async function flattenSource() {
  const { width, height } = await sharp(src).metadata();
  return sharp({
    create: { width, height, channels: 4, background: cream },
  })
    .composite([{ input: src }])
    .png()
    .toBuffer();
}

async function writePng(file, buffer) {
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(file);
}

async function masked(buffer, size, mask) {
  const resized = await sharp(buffer)
    .resize(size, size, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();
  return sharp(resized)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

const flat = await flattenSource();

for (const [density, sizes] of Object.entries(densities)) {
  const dir = path.join(resDir, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });

  const launcher = await masked(flat, sizes.launcher, roundedMask(sizes.launcher));
  const round = await masked(flat, sizes.launcher, circleMask(sizes.launcher));
  const foreground = await sharp(flat)
    .resize(sizes.foreground, sizes.foreground, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toBuffer();

  await writePng(path.join(dir, 'ic_launcher.png'), launcher);
  await writePng(path.join(dir, 'ic_launcher_round.png'), round);
  await writePng(path.join(dir, 'ic_launcher_foreground.png'), foreground);
}

console.log('Android launcher icons generated from icon-corail.png');
