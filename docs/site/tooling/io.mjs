import fs from 'node:fs/promises';
import path from 'node:path';
export async function files(directory) {
  const result = [];
  try { for (const e of await fs.readdir(directory, { withFileTypes: true })) { const p = path.join(directory,e.name); if (e.isDirectory()) result.push(...await files(p)); else result.push(p); } }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return result;
}
export async function write(file, value) { await fs.mkdir(path.dirname(file), { recursive:true }); await fs.writeFile(file,value); }
