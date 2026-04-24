import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const updateSessionProgressSchema = z.object({
  body: z.object({
    journeyId:         objectIdSchema,
    totalSession:      z.number().int().nonnegative(),
    compledSession:    z.number().int().nonnegative(),
  }).refine(data => data.compledSession <= data.totalSession, {
    message: "Completed sessions cannot exceed total sessions",
    path: ["compledSession"]
  }),
});

export const getSessionProgressSchema = z.object({
  params: z.object({
    journeyId: objectIdSchema,
  }),
});

