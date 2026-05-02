import { Journey } from './journey.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export const journeyService = {

  async create(userId: string, data: { journeyName: string; description?: string; imageUrl?: string }) {
    const journey = await Journey.create({
      journeyName: data.journeyName,
      description: data.description,
      imageUrl: data.imageUrl,
      createdBy: userId,
    });

    logger.info('Journey created', { id: journey._id });
    return Journey.findById(journey._id)
      .select('-imagePublicId')
      .populate('createdBy', 'firstName lastName')
      .lean();
  },

  async list() {
    return Journey.find({ isActive: true })
      .select('-imagePublicId')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
  },

  async getById(id: string) {
    const journey = await Journey.findById(id)
      .select('-imagePublicId')
      .populate('createdBy', 'firstName lastName')
      .lean();
    if (!journey) throw ApiError.notFound('Journey not found');
    return journey;
  },

  async update(id: string, data: { journeyName?: string; description?: string; imageUrl?: string; isActive?: boolean }) {
    const journey = await Journey.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select('-imagePublicId')
      .populate('createdBy', 'firstName lastName')
      .lean();
    if (!journey) throw ApiError.notFound('Journey not found');
    logger.info('Journey updated', { id });
    return journey;
  },

  async delete(id: string) {
    const journey = await Journey.findByIdAndDelete(id);
    if (!journey) throw ApiError.notFound('Journey not found');
    logger.info('Journey deleted', { id });
    return { message: 'Journey deleted successfully' };
  },
};
