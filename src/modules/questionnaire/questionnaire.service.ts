import { Questionnaire, SeverityLevel } from './questionnaire.model';
import { ApiError } from '../../utils/ApiError';

// ── Severity helpers ──────────────────────────────────────────────────────────

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

const avg = (arr: number[]) =>
  arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

// ── Service ───────────────────────────────────────────────────────────────────

export const questionnaireService = {

  // ── POST: Submit PHQ-9 ──────────────────────────────────────────────────────
  async submitPHQ9(userId: string, answers: number[]) {
    const score    = answers.reduce((a, b) => a + b, 0);
    const severity = getPHQ9Severity(score);

    const record = await Questionnaire.create({ userId, type: 'phq9', answers, score, severity });

    return {
      id:       record._id,
      type:     'phq9',
      score,
      severity,
      submittedAt: record.createdAt,
    };
  },

  // ── POST: Submit GAD-7 ──────────────────────────────────────────────────────
  async submitGAD7(userId: string, answers: number[]) {
    const score    = answers.reduce((a, b) => a + b, 0);
    const severity = getGAD7Severity(score);

    const record = await Questionnaire.create({ userId, type: 'gad7', answers, score, severity });

    return {
      id:       record._id,
      type:     'gad7',
      score,
      severity,
      submittedAt: record.createdAt,
    };
  },

  // ── POST: Submit DES-11 ─────────────────────────────────────────────────────
  async submitDES11(userId: string, answers: number[]) {
    const score = avg(answers); // DES-11 uses average, not sum

    const record = await Questionnaire.create({ userId, type: 'des11', answers, score });

    return {
      id:          record._id,
      type:        'des11',
      score,
      submittedAt: record.createdAt,
    };
  },

  // ── GET: All submissions for a type ────────────────────────────────────────
  async getAll(userId: string, type: 'phq9' | 'gad7' | 'des11') {
    const records = await Questionnaire.find({ userId, type })
      .sort({ createdAt: -1 })
      .lean();

    return {
      type,
      total: records.length,
      submissions: records.map((r) => ({
        id:          r._id,
        answers:     r.answers,
        score:       r.score,
        severity:    r.severity ?? null,
        submittedAt: r.createdAt,
      })),
    };
  },

  // ── GET: Single submission by ID ───────────────────────────────────────────
  async getOne(userId: string, id: string) {
    const record = await Questionnaire.findOne({ _id: id, userId }).lean();
    if (!record) throw ApiError.notFound('Submission not found');

    return {
      id:          record._id,
      type:        record.type,
      answers:     record.answers,
      score:       record.score,
      severity:    record.severity ?? null,
      submittedAt: record.createdAt,
    };
  },
};
