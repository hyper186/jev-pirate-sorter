import { decide } from '../../../lib/venice';
export async function POST(request: Request) {
  return decide(request, process.env.VENICE_API_KEY);
}
