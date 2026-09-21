import { decide } from '../../../lib/venice';
import { recordsFor } from '../../../lib/collection-server';
export const maxDuration = 30;
export async function POST(request: Request) {
 if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Use this demo’s own page to start a run.'},{status:403});
 let body;
 try { const text=await request.text();if(text.length>60000)throw Error('Request too large.');body=JSON.parse(text);body.records=recordsFor(body.tokenIds ?? body.records?.map((r:{tokenId:number})=>r.tokenId)); }
 catch { return Response.json({error:'Choose 1–128 unique pirate IDs from the collection.'},{status:400}); }
 return decide(new Request(request.url,{method:'POST',body:JSON.stringify(body)}), process.env.VENICE_API_KEY);
}
