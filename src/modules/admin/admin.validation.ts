import { z } from 'zod';

export const updateAdminProfileSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(61, 'Name cannot exceed 61 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
      .trim(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number. Example: +8801712345678')
      .optional(),
  }),
});
