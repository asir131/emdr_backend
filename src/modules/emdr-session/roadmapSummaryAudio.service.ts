import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { uploadGeneralMedia } from '../../utils/uploadImage';
import { IEmdrSession } from './emdrSession.model';

const compact = (value?: string | null) => (value || '').trim();
const joinList = (values: string[]) => values.filter(Boolean).join(', ');

export const buildRoadmapSummaryScript = (session: IEmdrSession): string => {
  const beliefPairs = session.beliefPairs || [];
  const negativeBeliefs = beliefPairs
    .map((pair) => compact(pair.negativeBelief))
    .filter(Boolean);
  const emotions = [
    compact(session.primaryEmotion),
    compact(session.additionalEmotions),
  ].filter(Boolean);
  const bodyLocation = compact(session.bodyLocation);
  const target = compact(session.freezeFrame) || compact(session.targetDescription);
  const targetPrefix = session.sessionType === 'future'
    ? 'You are imagining'
    : session.sessionType === 'words'
      ? 'You are bringing to mind'
      : session.sessionType === 'negative'
        ? 'You are focusing on'
        : 'You are remembering';
  const thoughtClause = negativeBeliefs.length
    ? `the thoughts are ${joinList(negativeBeliefs)}`
    : '';
  const emotionClause = emotions.length
    ? `you are feeling ${joinList(emotions)}`
    : '';
  const bodyClause = bodyLocation
    ? `it sits in ${bodyLocation}`
    : '';
  const middleClauses = [thoughtClause, emotionClause, bodyClause].filter(Boolean);
  const positiveBeliefs = beliefPairs
    .map((pair) => compact(pair.positiveBelief))
    .filter(Boolean);

  if (session.sessionType === 'addiction' && session.addictionContext) {
    const context = session.addictionContext;
    const addictionClauses = [
      compact(context.associatedThoughts)
        ? `the thoughts connected with it are ${compact(context.associatedThoughts)}`
        : '',
      compact(context.bodyLocation)
        ? `you notice it in ${compact(context.bodyLocation)}`
        : '',
      compact(context.visualization)
        ? `the image or shape that comes to mind is ${compact(context.visualization)}`
        : '',
    ].filter(Boolean);

    return [
      compact(context.aspect)
        ? `You are focusing on ${compact(context.aspect)}.`
        : '',
      compact(context.positiveFeeling)
        ? `The positive feeling is ${compact(context.positiveFeeling)}.`
        : '',
      addictionClauses.length ? addictionClauses.join(', ') + '.' : '',
      Number.isFinite(context.pfsRating)
        ? `The positive feeling scale rating is ${context.pfsRating} out of 10.`
        : '',
      'Now, when you are ready and have this in mind, press start.',
    ].filter(Boolean).join(' ');
  }

  return [
    target
      ? `${targetPrefix} ${target}.`
      : '',
    middleClauses.length ? middleClauses.join(', and ') + '.' : '',
    positiveBeliefs.length
      ? `The positive belief${positiveBeliefs.length > 1 ? 's are' : ' is'} ${joinList(positiveBeliefs)}.`
      : '',
    'Now, when you are ready and have this in mind, press start.',
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
