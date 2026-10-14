import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import YAML from 'yaml';
import { buildImages } from './images.mjs';
import { addHeadingAnchors } from './headings.mjs';
import { addCodeHighlighting } from './highlight.mjs';
import { dendronDate, isDendronIndex } from './dendron.mjs';
import { createHash } from 'node:crypto';
import { groupTopics } from './topics.mjs';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shell = (title, body, base = './') => `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escape(title)} — 日常、技術與沿途風景"><title>${escape(title)} · 沿途筆記</title>
<link rel="stylesheet" href="${base}style.css"><script defer src="${base}app.js"></script></head>
<body><header class="header"><a class="brand" href="${base}index.html"><span class="logo">N</span>沿途筆記<span class="brand-en">FIELD NOTES</span></a>
<nav><a href="${base}index.html">所有文章</a><a href="${base}index.html#about">關於</a><button id="theme" aria-label="切換深色模式"><span class="ui-icon" aria-hidden="true">◐</span></button></nav></header>
${body}<footer><span>沿途筆記 / 記錄每一個值得留下的瞬間</span><span>以文字，收藏日常。 © ${new Date().getFullYear()}</span></footer></body></html>`;
await fs.mkdir(out, { recursive: true });
await fs.mkdir(path.join(out, 'posts'), { recursive: true });
const images = await buildImages(root, out);
await fs.mkdir(path.join(out, 'vendor'), { recursive: true });
await fs.copyFile(path.join(root, 'node_modules/mermaid/dist/mermaid.min.js'), path.join(out, 'vendor/mermaid.min.js'));
for (const name of ['style.css', 'app.js']) await fs.copyFile(path.join(root,'src',name),path.join(out,name));
const posts = [];
const sourceDir = path.join(root, 'content/posts');
const files = [];
async function collectPosts(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = prefix + entry.name;
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(file);
    if (entry.isDirectory()) await collectPosts(path.join(directory, entry.name), file + '/');
  }
}
await collectPosts(sourceDir);
const articles = [];
const articleUrls = new Map();
for (const file of files) {
  const raw = (await fs.readFile(path.join(root,'content/posts',file),'utf8')).replace(/^\uFEFF/, '');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${file}: 需要 YAML front matter`);
  const meta = YAML.parse(match[1]);
  const originalName = path.basename(file);
  const dendron = typeof meta.created === 'number' && 'id' in meta;
  if (dendron && (isDendronIndex(originalName) || !match[2].trim())) continue;
  if (dendron) {
    meta.date = dendronDate(originalName, meta);
    if (typeof meta.tags === 'string') meta.tags = [meta.tags];
    meta.description = meta.description || meta.desc || match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').slice(0, 120) || meta.title;
  }
  for (const key of ['title','date','description']) if (!meta[key]) throw new Error(`${file}: 缺少 ${key}`);
  const slug = dendron
    ? 'note-' + createHash('sha256').update(originalName).digest('hex').slice(0, 16)
    : path.basename(file, '.md');
  const folder = file.split('/')[0];
  const year = file.includes('/') && /^\d{4}$/.test(folder) ? folder : String(meta.date).slice(0,4);
  if (!/^[\p{L}\p{N}_-]+$/u.test(slug)) throw new Error(`${file}: 文章檔名請使用文字、數字、底線與連字號`);
  const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
  const date = String(meta.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${file}: 日期格式應為 YYYY-MM-DD`);
  if (year !== date.slice(0,4)) throw new Error(`${file}: 年份資料夾與 date 不一致`);
  const url = year + '/' + slug;
  if (articles.some(p => p.url === url)) throw new Error(`${file}: 重複的文章網址 ${url}`);
  articles.push({ file, meta, body: match[2], date, slug, year, url, tags });
  articleUrls.set(file, url + '.html');
}
for (const { file, meta, body, date, slug, year, url, tags } of articles) {
  // ?? ../images ??????????????? ../../images?
  const renderer = new marked.Renderer();
  const renderToc = addHeadingAnchors(renderer);
  addCodeHighlighting(renderer);
  const originalLink = renderer.link;
  renderer.link = function(token) {
    const href = token.href;
    const match = href?.match(/^([^?#]*\.md)([?#].*)?$/i);
    if (match && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(href)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(match[1])));
      const destination = articleUrls.get(target);
      if (destination) {
        const relative = path.posix.relative(year, destination);
        return originalLink.call(this, { ...token, href: relative + (match[2] || '') });
      }
    }
    return originalLink.call(this, token);
  };
  const originalImage = renderer.image;
  renderer.image = function(token) {
    return originalImage.call(this, { ...token, href: images.rewrite(token.href) });
  };
  const html = images.rewriteHtml(marked.parse(body, { renderer }));
  const toc = renderToc();
  const minutes = Math.max(1, Math.ceil(body.length / 600));
  posts.push({ ...meta, date, slug, year, url, tags, minutes });
  await fs.mkdir(path.join(out, 'posts', year), { recursive: true });
  await fs.writeFile(path.join(out,'posts',year,slug+'.html'),shell(meta.title,`<main class="article-wrap"><a class="back" href="../../index.html"><span class="ui-icon" aria-hidden="true">←</span><span>回到所有文章</span></a><div class="eyebrow">${tags.map(escape).join(' / ')}</div><h1>${escape(meta.title)}</h1><p class="article-meta">${escape(date)} · ${minutes} 分鐘閱讀</p><p class="article-intro">${escape(meta.description)}</p><div class="article-layout${toc ? ' has-toc' : ''}">${toc}<article class="prose">${html}</article></div><a class="back end" href="../../index.html"><span class="ui-icon" aria-hidden="true">←</span><span>繼續閱讀其他筆記</span></a></main>`,'../../'));
}
posts.sort((a,b) => b.date.localeCompare(a.date));
const tags = [...new Set(posts.flatMap(p => p.tags))];
const renderCard = (p,i) => `<a class="card" href="./posts/${p.url}.html" data-tags="${escape(p.tags.join('|'))}" data-search="${escape([p.title,p.description,...p.tags].join(' ').toLowerCase())}"><div class="card-art art-${i%3}"><span class="art-number">0${i+1}</span><span class="art-label">${escape(p.tags[0] || '筆記')}</span><div class="art-shape"></div></div><div class="card-body"><div class="card-meta">${escape(p.date)} <span>${p.minutes} MIN READ</span></div><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><div class="card-bottom"><span>${p.tags.map(t=>'#'+escape(t)).join(' ')}</span><span class="ui-icon" aria-hidden="true">↗</span></div></div></a>`;
const years = [...new Set(posts.map(p => p.year))].sort((a,b) => b.localeCompare(a));
const latestPosts = posts.slice(0, 3);
const latestHtml = latestPosts.length ? `<section class="latest-articles" data-article-group aria-labelledby="latest-heading"><div class="year-heading"><h3 id="latest-heading">最新文章</h3><span class="year-count" data-year-count>${latestPosts.length}</span></div><div class="cards">${latestPosts.map(p => renderCard(p, posts.indexOf(p))).join('')}</div></section>` : '';
const cards = years.map(year => {
  const group = posts.filter(p => p.year === year);
  return `<details class="year-group" data-article-group data-year="${year}"><summary class="year-heading"><span class="year-title">${year}</span><span class="year-count" data-year-count>${group.length}</span></summary><div class="cards">${group.map(p => renderCard(p, posts.indexOf(p))).join('')}</div></details>`;
}).join('');
const topicsConfig = JSON.parse((await fs.readFile(path.join(root, 'topics.config.json'), 'utf8')).replace(/^\uFEFF/, ''));
const topicGroups = groupTopics(topicsConfig, posts);
const renderTopic = topic => `<details class="year-group topic-group" data-article-group data-topic="${escape(topic.id)}"><summary class="year-heading"><span class="year-title">${escape(topic.title)}</span><span class="year-count" data-year-count>${topic.posts.length}</span></summary>${topic.children.length ? `<div class="topic-children">${topic.children.map(renderTopic).join('')}</div>` : ''}${topic.directPosts.length ? `<div class="cards">${topic.directPosts.map(p => renderCard(p, posts.indexOf(p))).join('')}</div>` : ''}${topic.posts.length ? '' : '<p class="topic-empty">這個主題還沒有文章。</p>'}</details>`;
const topicsHtml = topicGroups.length ? `<details class="topic-section year-group" open><summary class="year-heading"><span class="year-title">主題專區</span></summary><div class="topic-groups">${topicGroups.map(renderTopic).join('')}</div></details>` : '';
const yearsHtml = years.length ? `<details class="year-section year-group" open><summary class="year-heading"><span class="year-title">依年份分類</span></summary><div class="year-groups">${cards}</div></details>` : '';
await fs.writeFile(path.join(out,'index.html'), shell('首頁',`<main><section class="hero"><div><div class="eyebrow"><span class="dot"></span> A PERSONAL JOURNAL</div><h1>生活的片刻，<br>都值得<span class="serif">記下。</span></h1><p>關於技術、日常與沿途風景。<br>在忙碌之間，留一點空白給思考。</p><a class="hero-link" href="#journal">探索筆記 <span class="ui-icon" aria-hidden="true">↓</span></a></div><div class="hero-art"><img class="hero-photo" src="${escape(images.rewrite('../../images/landscape.jpg').replace(/^\.\.\/\.\.\//, './'))}" alt="" fetchpriority="high"><div class="hero-overlay" aria-hidden="true"></div><span class="hero-caption">SLOW DOWN. LOOK AROUND.</span><span class="hero-coordinate">25° N / 121° E</span></div></section><section id="journal"><div class="section-head"><div><div class="eyebrow">THE JOURNAL</div><h2>最近的筆記<span>${posts.length.toString().padStart(2,'0')}</span></h2></div><label class="search"><span class="ui-icon" aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜尋筆記…" aria-label="搜尋文章"></label></div><details class="filter-disclosure"><summary>標籤篩選</summary><div class="filters"><button class="active" data-filter="all" aria-pressed="true">全部</button>${tags.map(t=>`<button data-filter="${escape(t)}" aria-pressed="false">${escape(t)}</button>`).join('')}</div></details><div class="view-tabs" role="tablist" aria-label="文章顯示方式"><button id="view-cards" role="tab" aria-selected="true" aria-controls="post-views" tabindex="0" data-view="cards">卡片</button><button id="view-list" role="tab" aria-selected="false" aria-controls="post-views" tabindex="-1" data-view="list">文字列表</button></div><div class="year-groups" id="post-views" role="tabpanel" aria-labelledby="view-cards" data-view="cards">${latestHtml}${topicsHtml}${yearsHtml}</div><p id="empty" hidden role="status">沒有符合的文章，試試其他關鍵字。</p></section><section id="about" class="about"><span class="eyebrow">BEHIND THE NOTES</span><h2>你好，這是我的文字角落。</h2><p>與 AI 合作整理思緒與筆記。這裡收錄學習的過程、生活的觀察，<br>以及那些平凡卻值得記住的小事。歡迎慢慢閱讀。</p><span class="signature">Keep exploring, keep writing.</span></section></main>`));
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built ${posts.length} articles → dist/`);
