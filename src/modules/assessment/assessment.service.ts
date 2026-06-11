import { Assessment, SeverityLevel } from './assessment.model';
import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';

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

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export const assessmentService = {

  /**
   * Universal calculation for final recommendation
   */
  async finalizeAssessment(assessment: any) {
    const totalScore = (assessment.phq9Score || 0) + (assessment.gad7Score || 0) + (assessment.des11Score || 0);
    assessment.totalScore = totalScore;

    // Safety threshold: Individual severe scores OR high dissociation
    const highRisk = 
      assessment.phq9Severity === 'severe' || 
      assessment.gad7Severity === 'severe' || 
      assessment.des11Score >= 33;

    // Minimum suitability threshold: totalScore must be at least 30
    if (totalScore < 30) {
      assessment.requiresProfessionalSupport = false;
      assessment.recommendation = 'Your scores indicate a low level of distress. You may not need a structured therapeutic program at this time.';
    } else if (highRisk) {
      assessment.requiresProfessionalSupport = true;
      assessment.recommendation = 'Your assessment scores suggest a high risk level. We recommend seeking professional support before beginning a self-guided program.';
    } else {
      assessment.requiresProfessionalSupport = false;
      assessment.recommendation = 'Your assessment results suggest you may benefit from our self-guided EMDR program.';
    }

    assessment.isCompleted = true;
    assessment.currentStep = 'completed';
    return assessment.save();
  },

  /**
   * STEP 1: PHQ-9
   */
  async submitPhq9(userId: string, phq9Answers: number[]) {
    const phq9Score = phq9Answers.reduce((a, b) => a + b, 0);
    const phq9Severity = getPHQ9Severity(phq9Score);

    if (phq9Score >= 27 || phq9Answers[8] >= 1) { 
       throw ApiError.validationError('Your assessment score indicates a high risk level. Please consult a professional.');
    }

    // Get user email
    const User = (await import('../auth/auth.model')).User;
    const user = await User.findById(userId).select('email');
    if (!user) throw ApiError.notFound('User not found');

    await Assessment.findOneAndUpdate(
      { userId, isCompleted: false },
      { phq9Answers, phq9Score, phq9Severity, currentStep: 'gad7', email: user.email },
      { upsert: true, new: true }
    );

    return { message: 'PHQ-9 submitted. Proceed to GAD-7.', score: phq9Score, severity: phq9Severity };
  },

  /**
   * STEP 2: GAD-7
   */
  async submitGad7(userId: string, gad7Answers: number[]) {
    const assessment = await Assessment.findOne({ userId, isCompleted: false });
    if (!assessment || assessment.currentStep !== 'gad7') {
      throw ApiError.validationError('Please complete PHQ-9 first.');
    }

    const gad7Score = gad7Answers.reduce((a, b) => a + b, 0);
    const gad7Severity = getGAD7Severity(gad7Score);

    if (gad7Score >= 21) {
       throw ApiError.validationError('Your anxiety score is at a critical level. Professional consultation is recommended.');
    }

    assessment.gad7Answers = gad7Answers;
    assessment.gad7Score = gad7Score;
    assessment.gad7Severity = gad7Severity;
    assessment.currentStep = 'des11';
    await assessment.save();

    return { message: 'GAD-7 submitted. Proceed to DES-11.', score: gad7Score, severity: gad7Severity };
  },

  /**
   * STEP 3: DES-11
   */
  async submitDes11(userId: string, des11Answers: number[]) {
    const assessment = await Assessment.findOne({ userId, isCompleted: false });
    if (!assessment || assessment.currentStep !== 'des11') {
      throw ApiError.validationError('Please complete previous assessment parts first.');
    }

    assessment.des11Answers = des11Answers;
    assessment.des11Score = Math.round(avg(des11Answers) * 10) / 10;
    
    const final = await this.finalizeAssessment(assessment);

    return {
      message: 'Assessment completed.',
      requiresProfessionalSupport: final.requiresProfessionalSupport,
      totalScore: final.totalScore,
      recommendation: final.recommendation,
      scores: { phq9: final.phq9Score, gad7: final.gad7Score, des11: final.des11Score }
    };
  },

  /**
   * FULL SUBMISSION (Singular API)
   */
  async submitFull(userId: string, phq9Answers: number[], gad7Answers: number[], des11Answers: number[]) {
    const phq9Score = phq9Answers.reduce((a, b) => a + b, 0);
    const gad7Score = gad7Answers.reduce((a, b) => a + b, 0);
    const des11Score = Math.round(avg(des11Answers) * 10) / 10;

    // Get user email
    const User = (await import('../auth/auth.model')).User;
    const user = await User.findById(userId).select('email');
    if (!user) throw ApiError.notFound('User not found');

    const assessment = new Assessment({
      userId,
      email: user.email,
      phq9Answers, phq9Score, phq9Severity: getPHQ9Severity(phq9Score),
      gad7Answers, gad7Score, gad7Severity: getGAD7Severity(gad7Score),
      des11Answers, des11Score,
    });

    const final = await this.finalizeAssessment(assessment);

    return {
      requiresProfessionalSupport: final.requiresProfessionalSupport,
      totalScore: final.totalScore,
      recommendation: final.recommendation,
      scores: {
        depression:   { score: final.phq9Score, severity: final.phq9Severity },
        anxiety:      { score: final.gad7Score, severity: final.gad7Severity },
        dissociation: { score: final.des11Score }
      },
      assessmentId: final._id
    };
  },

  async getLatestResult(userId: string) {
    const assessment = await Assessment.findOne({ userId, isCompleted: true })
      .sort({ createdAt: -1 })
      .lean<any>();

    if (!assessment) return null;

    // Get user email
    const user = await User.findById(userId).select('email').lean();
    assessment.email = user?.email || '';

    // Set default status if missing
    if (!assessment.status) {
      assessment.status = 'pending';
      await Assessment.updateOne({ _id: assessment._id }, { $set: { email: assessment.email, status: 'pending' } });
    }

    return assessment;
  },

  async updateStatus(assessmentId: string, status: 'pending' | 'approved' | 'cancelled') {
    const assessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { status },
      { new: true }
    );
    
    if (!assessment) {
      throw ApiError.notFound('Assessment not found');
    }
    
    return assessment;
  },
};
