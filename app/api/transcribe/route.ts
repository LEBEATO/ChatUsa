import { ApiError, failure, guard, openai } from '@/lib/server-ai';
export async function POST(request: Request) {
  try {
    guard(request);
    const reader = request.body?.getReader(); if (!reader) throw new ApiError('Gravação vazia.');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 1920044) { await reader.cancel(); throw new ApiError('Grave até 60 segundos.', 413); } chunks.push(value); }
    const wav = Buffer.concat(chunks);
    // Accept only our canonical mono PCM WAV, so duration is verified from samples, not client metadata.
    if (wav.length < 3244 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 16) !== 'WAVEfmt ' || wav.readUInt32LE(16) !== 16 || wav.readUInt16LE(20) !== 1 || wav.readUInt16LE(22) !== 1 || wav.readUInt32LE(24) !== 16000 || wav.readUInt32LE(28) !== 32000 || wav.readUInt16LE(32) !== 2 || wav.readUInt16LE(34) !== 16 || wav.toString('ascii', 36, 40) !== 'data' || wav.readUInt32LE(40) !== wav.length - 44 || wav.readUInt32LE(4) !== wav.length - 8 || (wav.length - 44) % 2 !== 0) throw new ApiError('Formato de gravação inválido. Grave novamente.');
    const form = new FormData(); form.append('file', new Blob([wav], { type: 'audio/wav' }), 'recording.wav'); form.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'); form.append('response_format', 'json');
    const response = await openai('audio/transcriptions', form); const data = await response.json();
    if (typeof data.text !== 'string' || data.text.length > 2000) throw new ApiError('Transcrição muito longa. Grave uma frase menor.');
    return Response.json({ text: data.text }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
