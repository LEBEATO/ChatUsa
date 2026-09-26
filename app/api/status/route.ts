import { configured } from '@/lib/server-ai';
export async function GET() { return Response.json({ configured: configured() }, { headers: { 'Cache-Control': 'no-store' } }); }
