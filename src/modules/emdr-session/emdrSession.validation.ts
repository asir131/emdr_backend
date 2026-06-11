import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Validates a 24-char hex MongoDB ObjectId */
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');

/** Non-empty trimmed string */
const nonEmptyStr = (maxLen: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(maxLen, `${label} must not exceed ${maxLen} characters`);

/** Reusable :id param */
const idParam = z.object({ id: objectId });

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_TYPE_VALUES = [
  'memory',
  'future',
  'words',
  'negative',
  'addiction',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. START SESSION
//    POST /api/emdr-session/start
// ─────────────────────────────────────────────────────────────────────────────

export const startSessionSchema = z.object({
  body: z.object({
    sessionType: z.enum(SESSION_TYPE_VALUES, {
      required_error: 'sessionType is required',
      invalid_type_error: `sessionType must be one of: ${SESSION_TYPE_VALUES.join(', ')}`,
    }),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SAVE TARGET (Step 1 + 2)
//    PATCH /api/emdr-session/:id/target
// ─────────────────────────────────────────────────────────────────────────────

export const saveTargetSchema = z.object({
  params: idParam,
  body: z.object({
    targetDescription: nonEmptyStr(2000, 'Target description'),
    freezeFrame      : nonEmptyStr(2000, 'Freeze frame description'),
  }).passthrough(), // Allow additional fields from multipart/form-data (files)
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SAVE BELIEF PAIRS (Steps 3–5: negative + positive + VOC)
//    PATCH /api/emdr-session/:id/beliefs
// ─────────────────────────────────────────────────────────────────────────────

const beliefPairInput = z.object({
  negativeBelief: nonEmptyStr(300, 'Negative belief'),
  positiveBelief: nonEmptyStr(300, 'Positive belief'),
  vocRating     : z
    .number({
      required_error  : 'VOC rating is required',
      invalid_type_error: 'VOC rating must be a number',
    })
    .int('VOC rating must be a whole number')
    .min(1, 'VOC rating minimum is 1')
    .max(7, 'VOC rating maximum is 7'),
});

export const saveBeliefPairsSchema = z.object({
  params: idParam,
  body: z.object({
    beliefPairs: z
      .array(beliefPairInput, { required_error: 'beliefPairs array is required' })
      .min(1, 'At least one belief pair is required')
      .max(10, 'Maximum 10 belief pairs allowed'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SAVE EMOTIONS (Steps 6–8)
//    PATCH /api/emdr-session/:id/emotions
// ─────────────────────────────────────────────────────────────────────────────

export const saveEmotionsSchema = z.object({
  params: idParam,
  body: z.object({
    primaryEmotion    : nonEmptyStr(500,  'Primary emotion'),
    additionalEmotions: z
      .string()
      .trim()
      .max(1000, 'Additional emotions must not exceed 1000 characters')
      .optional()
      .nullable(),
    bodyLocation      : nonEmptyStr(500,  'Body location'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SAVE SUD RATING (Step 9 — completes non-addiction session)
//    PATCH /api/emdr-session/:id/sud
// ─────────────────────────────────────────────────────────────────────────────

export const saveSudSchema = z.object({
  params: idParam,
  body: z.object({
    sudRating: z
      .number({
        required_error  : 'SUD rating is required',
        invalid_type_error: 'SUD rating must be a number',
      })
      .int('SUD rating must be a whole number')
      .min(0, 'SUD rating minimum is 0')
      .max(10, 'SUD rating maximum is 10'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAVE ADDICTION CONTEXT (completes addiction session)
//    PATCH /api/emdr-session/:id/addiction
// ─────────────────────────────────────────────────────────────────────────────

export const saveAddictionSchema = z.object({
  params: idParam,
  body: z.object({
    aspect            : nonEmptyStr(500,  'Addiction aspect'),
    positiveFeeling   : nonEmptyStr(200,  'Positive feeling'),
    pfsRating         : z
      .number({
        required_error  : 'PFS rating is required',
        invalid_type_error: 'PFS rating must be a number',
      })
      .int('PFS rating must be a whole number')
      .min(0, 'PFS rating minimum is 0')
      .max(10, 'PFS rating maximum is 10'),
    associatedThoughts: nonEmptyStr(1000, 'Associated thoughts'),
    bodyLocation      : nonEmptyStr(300,  'Body location'),
    visualization     : nonEmptyStr(500,  'Visualization'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. MARK SESSION COMPLETED
//    PATCH /api/emdr-session/:id/complete
// ─────────────────────────────────────────────────────────────────────────────

export const completeSessionSchema = z.object({
  params: idParam,
});

export const saveProcessingStateSchema = z.object({
  params: idParam,
  body: z.object({
    processingState: z
      .record(z.string(), z.unknown(), {
        required_error: 'processingState is required',
        invalid_type_error: 'processingState must be an object',
      })
      .nullable(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ID PARAM — used for GET /:id and DELETE /:id
// ─────────────────────────────────────────────────────────────────────────────

export const saveProcessingResultSchema = z.object({
  params: idParam,
  body: z.object({
    processingResult: z.record(z.string(), z.unknown(), {
      required_error: 'processingResult is required',
      invalid_type_error: 'processingResult must be an object',
    }),
  }),
});

export const idParamSchema = z.object({
  params: idParam,
});
