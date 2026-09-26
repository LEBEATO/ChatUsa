import { ApiError, failure, guard, openai, readJson } from '@/lib/server-ai';
export async function POST(request: Request) {
  try {
    guard(request); const { text, tutor, spelling } = await readJson(request);
    if (typeof text !== 'string' || !text.trim() || text.length > 2000 || !['Emma', 'Ethan'].includes(tutor) || typeof spelling !== 'boolean') throw new ApiError('Texto de áudio inválido.');
    const response = await openai('audio/speech', { model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts', voice: tutor === 'Emma' ? 'coral' : 'onyx', input: text, instructions: `Speak warmly and clearly in General American English. ${spelling ? 'Say each letter separately using its English alphabet name, with a pause between letters. Do not pronounce the whole word.' : 'Use a natural conversational teaching pace.'}`, response_format: 'mp3' });
    return new Response(await response.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
