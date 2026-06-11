import { BilateralItem, UserBilateralSettings, DirectionType, SpeedType } from './bilateral.model';
import { ApiError } from '../../utils/ApiError';
import { cloudinary } from '../../config/cloudinary';
import { logger } from '../../config/logger';

// ── Cloudinary upload ─────────────────────────────────────────────────────
const uploadFile = (
  buffer: Buffer,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw',
): Promise<{ url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        public_id:     publicId,
        overwrite:     true,
        resource_type: resourceType,
        folder:        'my-emdr/bilateral',
        ...(resourceType === 'image' && {
          transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
        }),
      },
      (err, result) => {
        if (err || !result) return reject(new ApiError(500, 'UPLOAD_FAILED', 'File upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    ).end(buffer);
  });

const getResourceType = (mimetype: string): 'image' | 'video' | 'raw' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw';
};

// ── Item CRUD ─────────────────────────────────────────────────────────────
export const bilateralService = {

  async list(type?: string, isActive?: string) {
    const filter: Record<string, unknown> = {};
    if (type)     filter.type     = type;
    if (isActive) filter.isActive = isActive === 'true';
    return BilateralItem.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
  },

  async getById(id: string) {
    const item = await BilateralItem.findById(id).lean();
    if (!item) throw ApiError.notFound('Item not found');
    return item;
  },

  async create(
    data: { type: string; name: string; fileUrl?: string; isActive?: boolean; sortOrder?: number },
    file?: Express.Multer.File,
  ) {
    let fileUrl = data.fileUrl;
    let publicId: string | undefined;

    if (file) {
      const resourceType = getResourceType(file.mimetype);
      const uploaded = await uploadFile(file.buffer, `bilateral_${Date.now()}`, resourceType);
      fileUrl   = uploaded.url;
      publicId  = uploaded.publicId;
    }

    if (!fileUrl) {
      throw new ApiError(400, 'FILE_REQUIRED', 'Provide a file upload or fileUrl');
    }

    const item = await BilateralItem.create({ ...data, fileUrl, publicId });
    logger.info('BilateralItem created', { id: item._id, type: data.type });
    return BilateralItem.findById(item._id).lean();
  },

  async update(
    id: string,
    data: { name?: string; fileUrl?: string; isActive?: boolean; sortOrder?: number },
    file?: Express.Multer.File,
  ) {
    const item = await BilateralItem.findById(id).select('+publicId');
    if (!item) throw ApiError.notFound('Item not found');

    if (file) {
      const resourceType = getResourceType(file.mimetype);
      const uploaded = await uploadFile(file.buffer, `bilateral_${id}_${Date.now()}`, resourceType);

      // Delete old file non-blocking
      if ((item as any).publicId) {
        cloudinary.uploader.destroy((item as any).publicId, { resource_type: resourceType })
          .catch(() => logger.warn('Old file delete failed', { id }));
      }

      data.fileUrl = uploaded.url;
      (data as any).publicId = uploaded.publicId;
    }

    Object.assign(item, data);
    await item.save();
    logger.info('BilateralItem updated', { id });
    return BilateralItem.findById(id).lean();
  },

  async delete(id: string) {
    const item = await BilateralItem.findById(id).select('+publicId');
    if (!item) throw ApiError.notFound('Item not found');

    if ((item as any).publicId) {
      const resourceType = item.fileUrl.includes('/video/') ? 'video' : 'image';
      cloudinary.uploader.destroy((item as any).publicId, { resource_type: resourceType })
        .catch(() => logger.warn('Cloudinary delete failed', { id }));
    }

    await item.deleteOne();
    logger.info('BilateralItem deleted', { id });
    return { message: 'Item deleted successfully' };
  },
};

// ── User Settings ─────────────────────────────────────────────────────────
export const settingsService = {

  async getFullConfig(userId: string) {
    const [environments, objects, sounds, userSettings] = await Promise.all([
      BilateralItem.find({ type: 'environment', isActive: true }).sort({ sortOrder: 1 }).lean(),
      BilateralItem.find({ type: 'object',      isActive: true }).sort({ sortOrder: 1 }).lean(),
      BilateralItem.find({ type: 'sound',        isActive: true }).sort({ sortOrder: 1 }).lean(),
      UserBilateralSettings.findOne({ userId }).lean(),
    ]);

    return { environments, objects, sounds, userSettings: userSettings ?? null };
  },

  async save(userId: string, data: {
    environmentId: string;
    iconUrl: string;
    soundId: string;
    direction: DirectionType;
    speed: SpeedType;
  }) {
    const direction = (data.direction as string) === 'left-right' ? 'horizontal' : data.direction;
    const settings = await UserBilateralSettings.findOneAndUpdate(
      { userId },
      { ...data, direction, userId },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    logger.info('User bilateral settings saved', { userId });
    return settings;
  },
};
