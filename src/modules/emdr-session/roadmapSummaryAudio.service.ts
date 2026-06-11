import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { uploadGeneralMedia } from '../../utils/uploadImage';
import { IEmdrSession } from './emdrSession.model';

const compact = (value?: string | null) => (value || '').trim();

export const buildRoadmapSummaryScript = (session: IEmdrSession): string => {
  const beliefPairs = session.beliefPairs || [];
  const primaryPair = beliefPairs[0];
  const positiveBeliefs = beliefPairs
    .map((pair) => compact(pair.positiveBelief))
    .filter(Boolean);

  if (session.sessionType === 'addiction' && session.addictionContext) {
    const context = session.addictionContext;
    return [
      'Your roadmap summary is ready.',
      `The addiction aspect you are working with is ${compact(context.aspect)}.`,
      `The positive feeling connected with it is ${compact(context.positiveFeeling)}.`,
      `The current positive feeling scale rating is ${context.pfsRating} out of 10.`,
      compact(context.associatedThoughts)
        ? `The associated thoughts are: ${compact(context.associatedThoughts)}.`
        : '',
      compact(context.bodyLocation)
        ? `You notice this in the body around ${compact(context.bodyLocation)}.`
        : '',
      compact(context.visualization)
        ? `The visualization is: ${compact(context.visualization)}.`
        : '',
      'When you are ready...',
    ].filter(Boolean).join(' ');
  }

  return [
    'Your roadmap summary is ready.',
    compact(session.targetDescription)
      ? `The original memory or image you are working with is: ${compact(session.targetDescription)}.`
      : '',
    compact(session.freezeFrame)
      ? `The freeze frame is: ${compact(session.freezeFrame)}.`
      : '',
    compact(primaryPair?.negativeBelief)
      ? `The negative belief is: ${compact(primaryPair.negativeBelief)}.`
      : '',
    positiveBeliefs.length
      ? `The positive belief${positiveBeliefs.length > 1 ? 's are' : ' is'}: ${positiveBeliefs.join('. ')}.`
      : '',
    compact(session.primaryEmotion)
      ? `The emotion you identified is: ${compact(session.primaryEmotion)}.`
      : '',
    compact(session.bodyLocation)
      ? `You notice this in the body around ${compact(session.bodyLocation)}.`
      : '',
    Number.isFinite(session.sudRating)
      ? `The starting SUDS rating is ${session.sudRating} out of 10.`
      : '',
    'When you are ready...',
  ].filter(Boolean).join(' ');
};

export const generateRoadmapSummaryAudio = async (
  session: IEmdrSession,
): Promise<{ text: string; audioUrl: string | null }> => {
  const text = buildRoadmapSummaryScript(session);

  if (!env.OPENAI_API_KEY) {
    logger.warn('Skipping roadmap summary TTS because OPENAI_API_KEY is not configured', {
      sessionId: session._id,
    });
    return { text, audioUrl: null };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_TTS_MODEL,
        voice: env.OPENAI_TTS_VOICE,
        input: text,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.warn('Roadmap summary TTS request failed', {
        sessionId: session._id,
        status: response.status,
        errorText: errorText.slice(0, 500),
      });
      return { text, audioUrl: null };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const uploaded = await uploadGeneralMedia(
      audioBuffer,
      'my-emdr/roadmap-summary-audio',
      `roadmap_summary_${session._id}_${Date.now()}`,
    );

    return { text, audioUrl: uploaded.url };
  } catch (error) {
    logger.warn('Roadmap summary TTS generation failed', {
      sessionId: session._id,
      error: error instanceof Error ? error.message : error,
    });
    return { text, audioUrl: null };
  }
};
