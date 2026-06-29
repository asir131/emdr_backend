import { generateVoiceAudio } from '../voice/voice.service';
import { IEmdrSession } from './emdrSession.model';

const compact = (value?: string | null, maxLength = 320) =>
  (value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
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
  const positiveBeliefs = beliefPairs
    .map((pair) => compact(pair.positiveBelief))
    .filter(Boolean);

  if (session.sessionType === 'addiction' && session.addictionContext) {
    const context = session.addictionContext;
    return [
      compact(context.aspect)
        ? `You are gently focusing on ${compact(context.aspect)}.`
        : '',
      compact(context.positiveFeeling)
        ? `You have described the feeling as ${compact(context.positiveFeeling)}.`
        : '',
      compact(context.associatedThoughts)
        ? `The thoughts connected with it are ${compact(context.associatedThoughts)}.`
        : '',
      compact(context.bodyLocation)
        ? `You notice this in ${compact(context.bodyLocation)}.`
        : '',
      compact(context.visualization)
        ? `Hold the image of ${compact(context.visualization)} lightly in mind.`
        : '',
      'There is no need to force anything. When you feel ready, press start and simply notice what comes.',
    ].filter(Boolean).join(' ');
  }

  return [
    target
      ? `${targetPrefix} ${target}.`
      : '',
    emotions.length
      ? `You described feeling ${joinList(emotions)}, and it makes sense that this experience still feels important.`
      : '',
    bodyLocation
      ? `You notice some of this in ${bodyLocation}.`
      : '',
    negativeBeliefs.length
      ? `The difficult thought${negativeBeliefs.length > 1 ? 's' : ''} you noticed ${negativeBeliefs.length > 1 ? 'were' : 'was'}: ${joinList(negativeBeliefs)}.`
      : '',
    positiveBeliefs.length
      ? `You are moving towards the belief${positiveBeliefs.length > 1 ? 's' : ''}: ${joinList(positiveBeliefs)}.`
      : '',
    'You do not need to force anything. When you feel ready, press start and gently notice what comes.',
  ].filter(Boolean).join(' ');
};

export const generateRoadmapSummaryAudio = async (
  session: IEmdrSession,
): Promise<{ text: string; audioUrl: string | null }> => {
  const text = buildRoadmapSummaryScript(session);

  const generated = await generateVoiceAudio(
    text,
    `roadmap-summary:${session._id.toString()}`,
  );

  return { text, audioUrl: generated?.audioUrl || null };
};
