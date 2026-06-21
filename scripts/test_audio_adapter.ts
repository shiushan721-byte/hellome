import 'dotenv/config';
import { generateAudio, listAvailableAudioModels } from '../src/server/adapters/audioAdapter';

async function main() {
  const models = listAvailableAudioModels();
  console.log('provider:', models.provider);
  console.log('models:', JSON.stringify(models.models, null, 2));

  const audio = await generateAudio({
    text: 'Audio adapter end-to-end test. If you can hear this, the local Chatterbox TTS pipeline is fully working.',
    language: 'English',
    timeoutMs: 180_000,
  });
  console.log('\n=== generateAudio result ===');
  console.log(JSON.stringify(audio, null, 2));
}
main().catch((e) => { console.error('FAIL:', e); process.exit(1); });