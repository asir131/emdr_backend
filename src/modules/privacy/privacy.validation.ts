import { z } from 'zod';

const sectionSchema = z.object({
  title:   z.string().min(1).max(100).trim(),
  content: z.string().min(1).trim(),
  bullets: z.array(z.string().min(1).trim()).optional(),
  order:   z.number().int().min(0),
});

const bodyBase = {
  version:       z.string().min(1, 'Version is required').trim(),
  overview:      z.string().min(10, 'Overview is required').trim(),
  effectiveDate: z.string().datetime({ message: 'Invalid effective date' }).optional(),
  lastUpdated:   z.string().datetime({ message: 'Invalid date' }).optional(),
  changelog:     z.string().max(1000).trim().optional(),
  sections:      z.array(sectionSchema).min(1, 'At least one section is required'),
  contactEmail:  z.string().email('Invalid contact email'),
  contactName:   z.string().min(1).max(100).trim(),
};

export const createPrivacySchema = z.object({
  body: z.object(bodyBase),
});

// PUT — full replace, all required
export const replacePrivacySchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID') }),
  body: z.object(bodyBase),
});

// PATCH — partial update, all optional
export const updatePrivacySchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID') }),
  body: z.object({
    version:       z.string().min(1).trim().optional(),
    overview:      z.string().min(10).trim().optional(),
    effectiveDate: z.string().datetime().optional(),
    lastUpdated:   z.string().datetime().optional(),
    changelog:     z.string().max(1000).trim().optional(),
    sections:      z.array(sectionSchema).min(1).optional(),
    contactEmail:  z.string().email().optional(),
    contactName:   z.string().min(1).max(100).trim().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID') }),
});
