import mongoose, { Schema, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SessionType = 'memory' | 'future' | 'words' | 'negative' | 'addiction';
export type SessionStatus = 'in_progress' | 'ready_for_bls' | 'completed' | 'abandoned';

export const SESSION_TYPES: SessionType[] = [
  'memory',
  'future',
  'words',
  'negative',
  'addiction',
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-DOCUMENT: Belief Pair
// Each negative belief is paired with a preferred positive belief + VOC score
// ─────────────────────────────────────────────────────────────────────────────

export interface IBeliefPair {
  negativeBelief : string;
  positiveBelief : string;
  vocRating      : number; // Validity of Cognition: 1 (not true) → 7 (completely true)
}

const beliefPairSchema = new Schema<IBeliefPair>(
  {
    negativeBelief : { type: String, required: true, trim: true, maxlength: 300 },
    positiveBelief : { type: String, required: true, trim: true, maxlength: 300 },
    vocRating      : { type: Number, required: true, min: 1, max: 7 },
  },
  { _id: false }, // embedded — no separate _id needed
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-DOCUMENT: Addiction Context
// Used only when sessionType === 'addiction'
// ─────────────────────────────────────────────────────────────────────────────

export interface IAddictionContext {
  aspect            : string; // "the rush", "the anticipation", etc.
  positiveFeeling   : string; // "relaxed", "euphoric", etc.
  pfsRating         : number; // Positive Feeling Scale: 0-10
  associatedThoughts: string; // mind chatter during the feeling
  bodyLocation      : string; // "chest", "head", etc.
  visualization     : string; // color / shape / image description
}

const addictionContextSchema = new Schema<IAddictionContext>(
  {
    aspect            : { type: String, required: true, trim: true, maxlength: 500 },
    positiveFeeling   : { type: String, required: true, trim: true, maxlength: 200 },
    pfsRating         : { type: Number, required: true, min: 0, max: 10 },
    associatedThoughts: { type: String, required: true, trim: true, maxlength: 1000 },
    bodyLocation      : { type: String, required: true, trim: true, maxlength: 300 },
    visualization     : { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCUMENT: EMDR Session
// ─────────────────────────────────────────────────────────────────────────────

export interface IEmdrSession extends Document {
  userId     : Types.ObjectId;
  sessionType: SessionType;
  status     : SessionStatus;

  // ── Step 1 & 2 — Target identification ────────────────────────────────────
  targetDescription: string | null; // "describe the memory / future / emotion"
  freezeFrame      : string | null; // "freeze frame moment"
  
  // ── Media files for target (optional) ─────────────────────────────────────
  targetMediaUrl     : string | null; // Cloudinary URL for target media
  freezeFrameMediaUrl: string | null; // Cloudinary URL for freeze frame media

  // ── Step 3-5 — Cognitive processing (non-addiction only) ─────────────────
  beliefPairs: IBeliefPair[];

  // ── Step 6-8 — Emotional + somatic processing ────────────────────────────
  primaryEmotion    : string | null;
  additionalEmotions: string | null;
  bodyLocation      : string | null;

  // ── Step 9 — Distress rating ──────────────────────────────────────────────
  sudRating: number | null; // Subjective Units of Disturbance: 0-10

  // ── Addiction path only ───────────────────────────────────────────────────
  addictionContext: IAddictionContext | null;

  // ── Metadata ──────────────────────────────────────────────────────────────
  completedAt: Date | null;
  createdAt  : Date;
  updatedAt  : Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const emdrSessionSchema = new Schema<IEmdrSession>(
  {
    userId: {
      type    : Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },

    sessionType: {
      type    : String,
      enum    : SESSION_TYPES,
      required: true,
    },

    status: {
      type   : String,
      enum   : ['in_progress', 'ready_for_bls', 'completed', 'abandoned'] as SessionStatus[],
      default: 'in_progress',
      index  : true,
    },

    // ── Target ──────────────────────────────────────────────────────────────
    targetDescription: { type: String, trim: true, maxlength: 2000, default: null },
    freezeFrame      : { type: String, trim: true, maxlength: 2000, default: null },
    
    // ── Target Media URLs ───────────────────────────────────────────────────
    targetMediaUrl     : { type: String, trim: true, default: null },
    freezeFrameMediaUrl: { type: String, trim: true, default: null },

    // ── Beliefs (array of pairs) ─────────────────────────────────────────────
    beliefPairs: {
      type    : [beliefPairSchema],
      default : [],
      validate: {
        validator: (v: IBeliefPair[]) => v.length <= 10,
        message  : 'A maximum of 10 belief pairs are allowed per session',
      },
    },

    // ── Emotions + body ──────────────────────────────────────────────────────
    primaryEmotion    : { type: String, trim: true, maxlength: 500,  default: null },
    additionalEmotions: { type: String, trim: true, maxlength: 1000, default: null },
    bodyLocation      : { type: String, trim: true, maxlength: 500,  default: null },

    // ── SUD ──────────────────────────────────────────────────────────────────
    sudRating: { type: Number, min: 0, max: 10, default: null },

    // ── Addiction ────────────────────────────────────────────────────────────
    addictionContext: { type: addictionContextSchema, default: null },

    // ── Metadata ─────────────────────────────────────────────────────────────
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    // Optimize common query: user's sessions sorted by date
    // and filtering by status
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// Fetch user's session history
emdrSessionSchema.index({ userId: 1, createdAt: -1 });

// Fetch user's active/in-progress sessions
emdrSessionSchema.index({ userId: 1, status: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL: isAddictionPath
// ─────────────────────────────────────────────────────────────────────────────

emdrSessionSchema.virtual('isAddictionPath').get(function (this: IEmdrSession) {
  return this.sessionType === 'addiction';
});

// ─────────────────────────────────────────────────────────────────────────────
// MODEL
// ─────────────────────────────────────────────────────────────────────────────

export const EmdrSession = mongoose.model<IEmdrSession>('EmdrSession', emdrSessionSchema);
