import { Document, Schema, model } from 'mongoose';

export interface IVoiceAudioCache extends Document {
  cacheKey: string;
  textHash: string;
  audioUrl: string;
  voiceId: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

const voiceAudioCacheSchema = new Schema<IVoiceAudioCache>(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    textHash: { type: String, required: true, index: true },
    audioUrl: { type: String, required: true, trim: true },
    voiceId: { type: String, required: true, trim: true },
    modelId: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const VoiceAudioCache = model<IVoiceAudioCache>(
  'VoiceAudioCache',
  voiceAudioCacheSchema,
);
