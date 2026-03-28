import { z } from 'zod';

export const shareLocationSchema = z.object({
  body: z.object({
    latitude: z
      .number({ required_error: 'Latitude is required' })
      .min(-90,  'Latitude must be between -90 and 90')
      .max(90,   'Latitude must be between -90 and 90'),
    longitude: z
      .number({ required_error: 'Longitude is required' })
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180,  'Longitude must be between -180 and 180'),
    accuracy: z.number().positive().optional(),
  }),
});
