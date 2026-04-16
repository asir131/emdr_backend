import mongoose, { Schema, Document } from 'mongoose';

export type SexType = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface IOnboarding extends Document {
  userId: mongoose.Types.ObjectId;

  // Step 1 — Profile
  dateOfBirth?: Date;
  sex?: SexType;

  // Step 2 — Safety Check
  safetyCheck?: {
    activeSuicidalThoughts: boolean;
    historyOfSeizures: boolean;
    pregnancy: boolean;
    severeDissociativeDisorders: boolean;
    activePsychosis: boolean;
    passedSafetyCheck: boolean;
  };

  // Step 3 — Consent
  consent?: {
    understoodEMDRNatureAndRisks: boolean;
    agreedToGDPR: boolean;
    participatingVoluntarily: boolean;
    savedCrisisSupportNumbers: boolean;
    optionalResearchParticipation: boolean;
    electronicSignature: string;
    signedAt: Date;
  };

  // Step tracking
  currentStep: number;
  isCompleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const onboardingSchema = new Schema<IOnboarding>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    dateOfBirth: { type: Date },
    sex: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },

    safetyCheck: {
      activeSuicidalThoughts:     { type: Boolean },
      historyOfSeizures:          { type: Boolean },
      pregnancy:                  { type: Boolean },
      severeDissociativeDisorders:{ type: Boolean },
      activePsychosis:            { type: Boolean },
      passedSafetyCheck:          { type: Boolean },
    },

    consent: {
      understoodEMDRNatureAndRisks:    { type: Boolean },
      agreedToGDPR:                    { type: Boolean },
      participatingVoluntarily:        { type: Boolean },
      savedCrisisSupportNumbers:       { type: Boolean },
      optionalResearchParticipation:   { type: Boolean },
      electronicSignature:             { type: String, trim: true },
      signedAt:                        { type: Date },
    },

    currentStep: { type: Number, default: 1 },
    isCompleted:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', onboardingSchema);
