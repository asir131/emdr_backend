import { z } from 'zod';

const sectionSchema = z.object({
  title:   z.string().min(1).max(100).trim(),
  content: z.string().min(1).trim(),
  bullets: z.array(z.string().min(1).trim()).optional(),
  order:   z.number().int().min(0),
});

export const createTermsSchema = z.object({
  body: z.object({
    version:       z.string().min(1, 'Version is required').trim(),
    lastUpdated:   z.string().datetime({ message: 'Invalid date format' }).optional(),
    effectiveDate: z.string().datetime({ message: 'Invalid effective date format' }).optional(),
    changelog:     z.string().max(1000, 'Changelog too long').trim().optional(),
    sections:      z.array(sectionSchema).min(1, 'At least one section is required'),
    contactEmail:  z.string().email('Invalid contact email'),
    contactName:   z.string().min(1).max(100).trim(),
  }),
});

export const updateTermsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  }),
  body: z.object({
    version:       z.string().min(1).trim().optional(),
    lastUpdated:   z.string().datetime().optional(),
    effectiveDate: z.string().datetime().optional(),
    changelog:     z.string().max(1000).trim().optional(),
    sections:      z.array(sectionSchema).min(1).optional(),
    contactEmail:  z.string().email().optional(),
    contactName:   z.string().min(1).max(100).trim().optional(),
  }),
});

// PUT — full replace, all fields required
export const replaceTermsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  }),
  body: z.object({
    version:       z.string().min(1, 'Version is required').trim(),
    lastUpdated:   z.string().datetime().optional(),
    effectiveDate: z.string().datetime().optional(),
    changelog:     z.string().max(1000).trim().optional(),
    sections:      z.array(sectionSchema).min(1, 'At least one section is required'),
    contactEmail:  z.string().email('Invalid contact email'),
    contactName:   z.string().min(1).max(100).trim(),
  }),
});

export const acceptTermsSchema = z.object({
  body: z.object({
    termsId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid Terms ID'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  }),
});
