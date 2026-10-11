import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function buildImages(root, out) {
  const config = JSON.parse((await fs.readFile(path.join(root, 'image.config.json'), 'utf8')).replace(/^\uFEFF/, ''));
  if (config.format !== 'webp') throw new Error('image.config.json: format must be webp');
  if (!Number.isInteger(config.quality) || config.quality < 1 || config.quality > 100) throw new Error('quality must be 1–100');
  if (!Number.isInteger(config.ppi) || config.ppi < 1) throw new Error('ppi must be a positive integer');
  if (typeof config.lossless !== 'boolean') throw new Error('lossless must be a boolean');
  if (!Number.isInteger(config.maxWidth) || config.maxWidth < 1) throw new Error('maxWidth must be a positive integer');
  const input = path.join(root, 'content/images');
  const output = path.join(out, 'images');
  const mapping = new Map();
  const files = [];
  async function walk(dir, prefix = '') {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative + '/');
      else if (entry.isFile()) files.push(relative);
    }
  }
  await walk(input);
  // Only the generated workspace image directory may be cleared.
  const expected = path.resolve(root, 'dist', 'images');
  if (path.resolve(output) !== expected) throw new Error('Refusing to clear images outside dist/images');
  const realRoot = await fs.realpath(root);
  const realOut = await fs.realpath(out);
  if (path.resolve(realOut) !== path.join(realRoot, 'dist')) throw new Error('Refusing to clear redirected dist');
  const current = await fs.lstat(output).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (current?.isSymbolicLink()) throw new Error('Refusing to clear linked image directory');
  await fs.rm(expected, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  const existing = new Set(files);
  let converted = 0;
  for (const relative of files) {
    const source = path.join(input, relative);
    const target = path.join(output, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (/\.svg$/i.test(relative)) {
      await fs.copyFile(source, target);
      continue;
    }
    if (!/\.(jpe?g|png|webp|avif|tiff?|gif)$/i.test(relative)) {
      throw new Error('Unsupported image source: ' + relative);
    }
    const metadata = await sharp(source).metadata();
    if ((metadata.pages || 1) > 1) throw new Error('Animated/multipage images require explicit conversion: ' + relative);
    const optimized = /\.webp$/i.test(relative) ? relative : relative + '.webp';
    if (optimized !== relative && existing.has(optimized)) throw new Error('Image output conflicts with source: ' + optimized);
    const result = await sharp(source).autoOrient()
      .resize({ width: config.maxWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .withDensity(config.ppi)
      .webp({ quality: config.quality, lossless: config.lossless, exact: true })
      .toFile(path.join(output, optimized));
    console.log(relative + ': ' + result.width + 'x' + result.height + ', ' + config.ppi + ' DPI');
    mapping.set(relative, optimized);
    converted++;
  }
  console.log('Images: ' + converted + ' converted to ' + config.format);
  function rewrite(url) {
    const match = url.match(/^(?:\.\.\/){1,2}images\/([^?#]+)([?#].*)?$/);
    if (!match) return url;
    let key;
    try { key = decodeURIComponent(match[1]); } catch { return url; }
    const result = mapping.get(key);
    return '../../images/' + (result ? result.split('/').map(encodeURIComponent).join('/') : match[1]) + (match[2] || '');
  }
  function rewriteHtml(html) {
    return html.replace(/<img\b[^>]*>/gi, tag =>
      tag.replace(/(\bsrc\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i, (all, prefix, double, single, bare) => {
        const value = double ?? single ?? bare;
        const next = rewrite(value);
        if (next === value) return all;
        const quote = double !== undefined ? '"' : single !== undefined ? "'" : '"';
        return prefix + quote + next + quote;
      }));
  }
  return { rewrite, rewriteHtml };
}
