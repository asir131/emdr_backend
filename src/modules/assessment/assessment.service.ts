import { Assessment, SeverityLevel } from './assessment.model';

const getPHQ9Severity = (score: number): SeverityLevel => {
  if (score <= 4)  return 'minimal';
  if (score <= 9)  return 'mild';
  if (score <= 14) return 'moderate';
  if (score <= 19) return 'moderately_severe';
  return 'severe';
};

const getGAD7Severity = (score: number): SeverityLevel => {
  if (score <= 4)  return 'minimal';
  if (score <= 9)  return 'mild';
  if (score <= 14) return 'moderate';
  return 'severe';
};

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

export const assessmentService = {

  async submit(userId: string, phq9Answers: number[], gad7Answers: number[], des11Answers: number[]) {
    const phq9Score    = phq9Answers.reduce((a, b) => a + b, 0);
    const gad7Score    = gad7Answers.reduce((a, b) => a + b, 0);
    const des11Score   = Math.round(avg(des11Answers) * 10) / 10;

    const phq9Severity = getPHQ9Severity(phq9Score);
    const gad7Severity = getGAD7Severity(gad7Score);

    // Require professional support if severe scores or high dissociation
    const requiresProfessionalSupport =
      phq9Severity === 'severe' ||
      phq9Severity === 'moderately_severe' ||
      gad7Severity === 'severe' ||
      des11Score >= 30 ||
      phq9Answers[8] >= 1; // Q9 — suicidal ideation

    const recommendation = requiresProfessionalSupport
      ? 'Based on your responses, we recommend seeking immediate professional support before beginning a self-guided EMDR program.'
      : 'Your assessment results suggest you may benefit from our self-guided EMDR program. Please proceed to select a plan.';

    const assessment = await Assessment.create({
      userId,
      phq9Answers, phq9Score, phq9Severity,
      gad7Answers, gad7Score, gad7Severity,
      des11Answers, des11Score,
      requiresProfessionalSupport,
      recommendation,
    });

    return {
      scores: {
        depression:   { score: phq9Score, outOf: 27, severity: phq9Severity },
        anxiety:      { score: gad7Score, outOf: 21, severity: gad7Severity },
        dissociation: { score: des11Score, unit: '%' },
      },
      requiresProfessionalSupport,
      recommendation,
      assessmentId: assessment._id,
    };
  },

  async getLatestResult(userId: string) {
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!assessment) return null;

    return {
      scores: {
        depression:   { score: assessment.phq9Score, outOf: 27, severity: assessment.phq9Severity },
        anxiety:      { score: assessment.gad7Score, outOf: 21, severity: assessment.gad7Severity },
        dissociation: { score: assessment.des11Score, unit: '%' },
      },
      requiresProfessionalSupport: assessment.requiresProfessionalSupport,
      recommendation: assessment.recommendation,
      completedAt: assessment.createdAt,
    };
  },
};
