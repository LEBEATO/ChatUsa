/** Wait for asynchronous browser voice discovery without leaving listeners behind. */
export function americanVoice(synth: SpeechSynthesis, signal: AbortSignal): Promise<SpeechSynthesisVoice> {
  return new Promise((resolve, reject) => {
    function cleanup() {
      clearTimeout(timeout);
      synth.removeEventListener('voiceschanged', check);
      signal.removeEventListener('abort', abort);
    }
    function abort() {
      cleanup();
      reject(new DOMException('Áudio cancelado.', 'AbortError'));
    }
    function check() {
      const voices = synth.getVoices().filter(voice => voice.lang.toLowerCase().replace('_', '-') === 'en-us');
      const voice = voices.find(voice => voice.localService) ?? voices[0];
      if (voice) { cleanup(); resolve(voice); }
    }
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Nenhuma voz de inglês americano (en-US) está disponível. Instale uma voz de inglês dos Estados Unidos nas configurações de voz do sistema ou tente outro navegador. Depois, tente ouvir novamente.'));
    }, 5000);
    if (signal.aborted) { abort(); return; }
    synth.addEventListener('voiceschanged', check);
    signal.addEventListener('abort', abort, { once: true });
    check();
  });
}
