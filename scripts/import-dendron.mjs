import fs from 'node:fs/promises';
import path from 'node:path';
import { readNote, dendronDate } from './dendron.mjs';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-dendron.mjs <vault directory>');
const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'content/posts');
const report = [];
for (const entry of await fs.readdir(source, {withFileTypes:true})) {
  if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue;
  const input = path.join(source, entry.name);
  const buffer = await fs.readFile(input);
  const note = readNote(buffer.toString('utf8'));
  const date = dendronDate(entry.name, note.meta);
  const year = date?.slice(0,4) || 'undated';
  const output = path.join(destination, year, entry.name);
  await fs.mkdir(path.dirname(output), {recursive:true});
  let status = 'copied';
  try {
    await fs.copyFile(input, output, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!(await fs.readFile(output)).equals(buffer)) throw new Error('Different file already exists: ' + output);
    status = 'identical';
  }
  report.push({source:input,destination:path.relative(root,output).replaceAll('\\','/'),year,date:date || null,status});
}
await fs.writeFile(path.join(root,'content/import-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.reduce((counts,item)=>{counts[item.year]=(counts[item.year]||0)+1;return counts;},{}),null,2));
console.log('Markdown files verified/copied: ' + report.length);
