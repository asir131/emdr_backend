import { z } from 'zod';

export const profileStepSchema = z.object({
  body: z.object({
    dateOfBirth: z.string({ required_error: 'Date of birth is required' })
      .refine(d => !isNaN(Date.parse(d)), 'Invalid date format'),
    sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
      required_error: 'Sex is required',
    }),
  }),
});

export const safetyCheckSchema = z.object({
  body: z.object({
    activeSuicidalThoughts:      z.boolean(),
    historyOfSeizures:           z.boolean(),
    pregnancy:                   z.boolean(),
    severeDissociativeDisorders: z.boolean(),
    activePsychosis:             z.boolean(),
  }),
});

export const consentSchema = z.object({
  body: z.object({
    understoodEMDRNatureAndRisks:  z.literal(true, { errorMap: () => ({ message: 'You must understand EMDR nature and risks' }) }),
    agreedToGDPR:                  z.literal(true, { errorMap: () => ({ message: 'You must agree to GDPR data processing' }) }),
    participatingVoluntarily:      z.literal(true, { errorMap: () => ({ message: 'You must confirm voluntary participation' }) }),
    savedCrisisSupportNumbers:     z.literal(true, { errorMap: () => ({ message: 'You must confirm saving crisis support numbers' }) }),
    optionalResearchParticipation: z.boolean(),
    electronicSignature:           z.string({ required_error: 'Electronic signature is required' }).min(2, 'Signature too short'),
  }),
});
