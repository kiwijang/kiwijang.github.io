import YAML from 'yaml';
export function dendronDate(name, meta) {
  const dated = name.match(/(?:^|\.)(\d{4})\.(\d{2})(\d{2})(?:-|\.|$)/);
  if (dated) return dated[1] + '-' + dated[2] + '-' + dated[3];
  const namedYear = name.match(/(?:^|\.)(\d{4})(?:\.|$)/)?.[1];
  let createdDate;
  if (typeof meta.created === 'number' && Number.isFinite(meta.created)) {
    const date = new Date(meta.created);
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei', year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
      const get = type => parts.find(p => p.type === type).value;
      createdDate = get('year') + '-' + get('month') + '-' + get('day');
    }
  }
  if (namedYear) return createdDate?.startsWith(namedYear + '-') ? createdDate : namedYear + '-01-01';
  if (meta.date && /^\d{4}-\d{2}-\d{2}$/.test(String(meta.date))) return String(meta.date);
  return createdDate;
}
export function readNote(raw) {
  const match = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  return match ? {meta:YAML.parse(match[1]) || {},body:match[2]} : {meta:{},body:raw};
}
export function isDendronIndex(name) {
  return /^(?:tags(?:\..*)?|root|other|0?drops(?:\.\d{4})?)\.md$/i.test(name);
}
