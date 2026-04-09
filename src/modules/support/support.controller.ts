import { Response, NextFunction } from 'express';
import { supportService } from './support.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const supportController = {
  /**
   * Submit a support ticket (User)
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await supportService.createTicket(req.user!.userId, req.body);
      respond(res, data, 201);
    } catch (e) { next(e); }
  },

  /**
   * Get my tickets (User)
   */
  getMyTickets: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await supportService.getMyTickets(req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  /**
   * Get ticket BY ID (User or Admin)
   */
  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user?.role === 'admin';
      const data = await supportService.getTicketById(req.params.id, req.user!.userId, isAdmin);
      respond(res, data);
    } catch (e) { next(e); }
  },

  /**
   * Get all tickets (Admin)
   */
  getAllAdmin: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, priority, page, limit } = req.query;
      const data = await supportService.getAllTicketsAdmin({
        status: status as string,
        priority: priority as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });
      respond(res, data);
    } catch (e) { next(e); }
  },

  /**
   * Respond to a ticket (Admin)
   */
  respond: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { response, status } = req.body;
      const data = await supportService.respondToTicket(
        req.params.id,
        req.user!.userId,
        response,
        status
      );
      respond(res, data);
    } catch (e) { next(e); }
  },
};
