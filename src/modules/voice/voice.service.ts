import { createHash } from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { uploadGeneralMedia } from '../../utils/uploadImage';
import { VoiceAudioCache } from './voice.model';

export interface GeneratedVoiceAudio {
  audioUrl: string;
  cached: boolean;
}

const activeGenerations = new Map<string, Promise<GeneratedVoiceAudio | null>>();

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const buildCacheKey = (text: string, cacheNamespace?: string) => {
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  const textHash = hash(normalizedText);
  const cacheKey = hash([
    'elevenlabs-v1',
    cacheNamespace || 'session-prompt',
    env.ELEVENLABS_VOICE_ID,
    env.ELEVENLABS_MODEL_ID,
    env.ELEVENLABS_OUTPUT_FORMAT,
    textHash,
  ].join(':'));

  return { normalizedText, textHash, cacheKey };
};

const generateUncached = async (
  text: string,
  cacheNamespace?: string,
): Promise<GeneratedVoiceAudio | null> => {
  const { normalizedText, textHash, cacheKey } = buildCacheKey(text, cacheNamespace);

  const existing = await VoiceAudioCache.findOne({ cacheKey }).lean().catch((error) => {
    logger.warn('Unable to read ElevenLabs voice cache', {
      error: error instanceof Error ? error.message : error,
    });
    return null;
  });

  if (existing?.audioUrl) {
    return { audioUrl: existing.audioUrl, cached: true };
  }

  if (!env.ELEVENLABS_API_KEY) {
    logger.error('ElevenLabs TTS is not configured. Add ELEVENLABS_API_KEY to the backend .env file.');
    return null;
  }

  try {
    const endpoint = new URL(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(env.ELEVENLABS_VOICE_ID)}`,
    );
    endpoint.searchParams.set('output_format', env.ELEVENLABS_OUTPUT_FORMAT);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: normalizedText,
        model_id: env.ELEVENLABS_MODEL_ID,
        language_code: 'en',
        voice_settings: {
          stability: 0.58,
          similarity_boost: 0.78,
          style: 0.12,
          use_speaker_boost: true,
          speed: 0.94,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.error('ElevenLabs TTS request failed', {
        status: response.status,
        error: errorText.slice(0, 500),
        cacheNamespace,
      });
      return null;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const uploaded = await uploadGeneralMedia(
      audioBuffer,
      'my-emdr/elevenlabs-voice',
      `elevenlabs_${cacheKey}`,
    );

    await VoiceAudioCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        textHash,
        audioUrl: uploaded.url,
        voiceId: env.ELEVENLABS_VOICE_ID,
        modelId: env.ELEVENLABS_MODEL_ID,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).catch((error) => {
      logger.warn('Unable to persist ElevenLabs voice cache metadata', {
        error: error instanceof Error ? error.message : error,
      });
    });

    return { audioUrl: uploaded.url, cached: false };
  } catch (error) {
    logger.error('ElevenLabs TTS generation failed', {
      error: error instanceof Error ? error.message : error,
      cacheNamespace,
    });
    return null;
  }
};

export const generateVoiceAudio = async (
  text: string,
  cacheNamespace?: string,
): Promise<GeneratedVoiceAudio | null> => {
  const { cacheKey } = buildCacheKey(text, cacheNamespace);
  const active = activeGenerations.get(cacheKey);
  if (active) return active;

  const generation = generateUncached(text, cacheNamespace).finally(() => {
    activeGenerations.delete(cacheKey);
  });
  activeGenerations.set(cacheKey, generation);
  return generation;
};
