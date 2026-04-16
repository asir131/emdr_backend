import { Onboarding } from './onboarding.model';
import { ApiError } from '../../utils/ApiError';

export const onboardingService = {

  async getStatus(userId: string) {
    const record = await Onboarding.findOne({ userId }).lean();
    return {
      currentStep: record?.currentStep ?? 1,
      isCompleted: record?.isCompleted ?? false,
      profile:     record ? { dateOfBirth: record.dateOfBirth, sex: record.sex } : null,
      safetyCheck: record?.safetyCheck ?? null,
      consent:     record?.consent ?? null,
    };
  },

  // Step 1 — Profile (dob + sex)
  async saveProfile(userId: string, dateOfBirth: string, sex: string) {
    const record = await Onboarding.findOneAndUpdate(
      { userId },
      { dateOfBirth: new Date(dateOfBirth), sex, currentStep: Math.max(2, 0) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Advance step only if not already further
    if (record.currentStep < 2) {
      record.currentStep = 2;
      await record.save();
    }
    return { message: 'Profile saved', currentStep: record.currentStep };
  },

  // Step 2 — Safety Check
  async saveSafetyCheck(userId: string, data: {
    activeSuicidalThoughts: boolean;
    historyOfSeizures: boolean;
    pregnancy: boolean;
    severeDissociativeDisorders: boolean;
    activePsychosis: boolean;
  }) {
    const failed = data.activeSuicidalThoughts || data.historyOfSeizures ||
                   data.pregnancy || data.severeDissociativeDisorders || data.activePsychosis;

    const safetyCheck = { ...data, passedSafetyCheck: !failed };

    const record = await Onboarding.findOneAndUpdate(
      { userId },
      { safetyCheck, currentStep: failed ? 2 : 3 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (failed) {
      throw ApiError.validationError(
        'You cannot continue due to one or more safety conditions. Please seek immediate professional support.',
        'safetyCheck'
      );
    }

    return { message: 'Safety check passed', currentStep: record.currentStep };
  },

  // Step 3 — Consent + Electronic Signature
  async saveConsent(userId: string, data: {
    understoodEMDRNatureAndRisks: boolean;
    agreedToGDPR: boolean;
    participatingVoluntarily: boolean;
    savedCrisisSupportNumbers: boolean;
    optionalResearchParticipation: boolean;
    electronicSignature: string;
  }) {
    const consent = { ...data, signedAt: new Date() };

    const record = await Onboarding.findOneAndUpdate(
      { userId },
      { consent, currentStep: 4, isCompleted: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { message: 'Consent recorded. Onboarding complete.', currentStep: record.currentStep };
  },
};
