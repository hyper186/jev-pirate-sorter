import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
let collection: Map<number, { tokenId: number; traits: Record<string,string> }>;
export function recordsFor(ids: unknown) {
 if(!Array.isArray(ids) || !ids.length || ids.length>128 || ids.some(id=>!Number.isInteger(id) || id<1 || id>9999) || new Set(ids).size!==ids.length)throw Error('Choose 1–128 unique pirate IDs from 1–9,999.');
 collection ||= new Map((JSON.parse(readFileSync(join(process.cwd(),'public/collection-v1.json'),'utf8')) as {tokenId:number;traits:Record<string,string>}[]).map(p=>[p.tokenId,p]));
 return ids.map(id=>collection.get(id)!);
}
