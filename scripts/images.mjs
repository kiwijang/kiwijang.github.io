import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export function selectImageOptions(config, relative, metadata, bytes) {
  const rule = config.largeImages;
  const orientedWidth = [5,6,7,8].includes(metadata.orientation) ? metadata.height : metadata.width;
  const large = rule && (orientedWidth >= rule.minWidth || bytes >= rule.minBytes);
  // JPEG inputs generally contain photographs; PNG and other inputs retain lossless encoding.
  const preset = large ? {
    maxWidth: rule.maxWidth,
    quality: rule.quality,
    lossless: metadata.format === 'jpeg' ? false : config.lossless
  } : {};
  return { ...config, ...preset, ...config.overrides?.[relative] };
}

export async function buildImages(root, out) {
  const config = JSON.parse((await fs.readFile(path.join(root, 'image.config.json'), 'utf8')).replace(/^\uFEFF/, ''));
  if (config.format !== 'webp') throw new Error('image.config.json: format must be webp');
  if (!Number.isInteger(config.quality) || config.quality < 1 || config.quality > 100) throw new Error('quality must be 1–100');
  if (!Number.isInteger(config.ppi) || config.ppi < 1) throw new Error('ppi must be a positive integer');
  if (typeof config.lossless !== 'boolean') throw new Error('lossless must be a boolean');
  if (!Number.isInteger(config.maxWidth) || config.maxWidth < 1) throw new Error('maxWidth must be a positive integer');
  if (config.largeImages) {
    for (const key of ['minWidth', 'minBytes', 'maxWidth']) {
      if (!Number.isInteger(config.largeImages[key]) || config.largeImages[key] < 1) throw new Error('Invalid largeImages.' + key);
    }
    if (!Number.isInteger(config.largeImages.quality) || config.largeImages.quality < 1 || config.largeImages.quality > 100) throw new Error('Invalid largeImages.quality');
  }
  const overrides = config.overrides || {};
  if (typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('overrides must be an object');
  for (const [name, override] of Object.entries(overrides)) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) throw new Error('Invalid override: ' + name);
    const options = { ...config, ...override };
    if (!Number.isInteger(options.maxWidth) || options.maxWidth < 1) throw new Error('Invalid maxWidth: ' + name);
    if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) throw new Error('Invalid quality: ' + name);
    if (typeof options.lossless !== 'boolean') throw new Error('Invalid lossless: ' + name);
  }
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
    const options = selectImageOptions(config, relative, metadata, (await fs.stat(source)).size);
    const density = Math.max(350, config.ppi, metadata.density || 0);
    const result = await sharp(source).autoOrient()
      .resize({ width: options.maxWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .withDensity(density)
      .webp({ quality: options.quality, lossless: options.lossless, exact: true, effort: 6 })
      .toFile(path.join(output, optimized));
    console.log(relative + ': ' + result.width + 'x' + result.height + ', ' + density + ' DPI');
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
