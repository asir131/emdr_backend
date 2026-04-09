import { SupportTicket, TicketStatus, TicketPriority } from './support.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export const supportService = {
  /**
   * Create a new support ticket
   */
  async createTicket(userId: string, data: { category: string; message: string; priority?: TicketPriority }) {
    const ticket = await SupportTicket.create({
      userId,
      category: data.category,
      message: data.message,
      priority: data.priority || TicketPriority.MEDIUM,
    });

    logger.info('Support ticket created', { ticketId: ticket._id, userId });
    return ticket;
  },

  /**
   * Get tickets for the logged-in user
   */
  async getMyTickets(userId: string) {
    return SupportTicket.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  },

  /**
   * Get all tickets (Admin only) with filtering and pagination
   */
  async getAllTicketsAdmin(query: { status?: string; priority?: string; page?: number; limit?: number }) {
    const { status, priority, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'firstName lastName email phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get ticket details by ID
   */
  async getTicketById(ticketId: string, userId?: string, isAdmin = false) {
    const query: any = { _id: ticketId };
    if (!isAdmin && userId) {
      query.userId = userId;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('respondedBy', 'firstName lastName email')
      .lean();

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    return ticket;
  },

  /**
   * Admin respond to a ticket
   */
  async respondToTicket(ticketId: string, adminId: string, response: string, status?: TicketStatus) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        adminResponse: response,
        respondedBy: adminId,
        respondedAt: new Date(),
        status: status || TicketStatus.RESOLVED,
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    logger.info('Support ticket responded', { ticketId, adminId, status: ticket.status });
    
    // TODO: Send notification to user about the response
    
    return ticket;
  },
};
