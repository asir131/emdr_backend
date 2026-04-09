import { z } from 'zod';
import { TicketStatus, TicketPriority } from './support.model';

export const createTicketSchema = z.object({
  body: z.object({
    category: z.string({ required_error: 'Category is required' }).min(2).max(100).trim(),
    message:  z.string({ required_error: 'Message is required' }).min(10).max(2000).trim(),
    priority: z.nativeEnum(TicketPriority).optional(),
  }),
});

export const respondTicketSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ticket ID'),
  }),
  body: z.object({
    response: z.string({ required_error: 'Response is required' }).min(5).max(2000).trim(),
    status:   z.nativeEnum(TicketStatus).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ticket ID'),
  }),
});

export const adminQuerySchema = z.object({
  query: z.object({
    status:   z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    page:     z.string().regex(/^\d+$/).transform(Number).optional(),
    limit:    z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
