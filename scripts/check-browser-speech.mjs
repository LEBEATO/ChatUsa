import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('lib/browser-speech.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { americanVoice } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
class Voices extends EventTarget {
  voices = [];
  getVoices() { return this.voices; }
}
const synth = new Voices();
const local = { lang: 'en-US', localService: true };
const remote = { lang: 'en-US', localService: false };
synth.voices = [remote, local];
assert.equal(await americanVoice(synth, new AbortController().signal), local);
synth.voices = [];
const delayed = americanVoice(synth, new AbortController().signal);
synth.voices = [{ lang: 'en-GB' }];
synth.dispatchEvent(new Event('voiceschanged'));
synth.voices.push(local);
synth.dispatchEvent(new Event('voiceschanged'));
assert.equal(await delayed, local);
synth.voices = [];
const controller = new AbortController();
const cancelled = americanVoice(synth, controller.signal);
controller.abort();
await assert.rejects(cancelled, { name: 'AbortError' });
await assert.rejects(americanVoice(synth, controller.signal), { name: 'AbortError' });
synth.voices = [{ lang: 'en-GB' }];
await assert.rejects(americanVoice(synth, new AbortController().signal), /en-US/);
console.log('PASS: en-US selection, local preference, voiceschanged, cancellation, unavailable voice.');
