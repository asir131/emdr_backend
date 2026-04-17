import { Category } from './category.model';
import { Media } from './media.model';
import { ApiError } from '../../utils/ApiError';
import { cloudinary } from '../../config/cloudinary';
import { logger } from '../../config/logger';

 
const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const ALLOWED_MIMETYPES: Record<string, string> = {
  'image/jpeg':    'image',
  'image/jpg':     'image',
  'image/png':     'image',
  'image/webp':    'image',
  'image/svg+xml': 'image',
  'video/mp4':     'video',
  'video/mpeg':    'video',
  'audio/mpeg':    'audio',
  'audio/mp3':     'audio',
  'audio/wav':     'audio',
};

const uploadToCloudinary = (
  buffer: Buffer,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw',
): Promise<{ url: string; publicId: string; size: number }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id:     publicId,
        overwrite:     true,
        resource_type: resourceType,
        folder:        'my-emdr/media',
        ...(resourceType === 'image' && {
          transformation: [
            { quality: 'auto:best', fetch_format: 'auto' },
          ],
        }),
      },
      (err, result) => {
        if (err || !result) {
          logger.error('Cloudinary upload failed', { err });
          return reject(new ApiError(500, 'UPLOAD_FAILED', 'File upload failed'));
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          size:     result.bytes,
        });
      },
    );
    stream.end(buffer);
  });

 
export const categoryService = {

  async create(userId: string, categoryName: string) {
    const slug = toSlug(categoryName);
    const exists = await Category.findOne({ $or: [{ categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } }, { slug }] });
    if (exists) throw ApiError.validationError('Category name already exists', 'categoryName');

    const category = await Category.create({ categoryName, slug, createdBy: userId });
    logger.info('Category created', { id: category._id, categoryName });
    return category;
  },

  async list() {
    return Category.find().sort({ createdAt: -1 }).lean();
  },

  async getById(id: string) {
    const category = await Category.findById(id).lean();
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },

  async update(id: string, data: { categoryName?: string; isActive?: boolean }) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

    if (data.categoryName && data.categoryName !== category.categoryName) {
      const exists = await Category.findOne({
        categoryName: { $regex: new RegExp(`^${data.categoryName}$`, 'i') },
        _id: { $ne: id },
      });
      if (exists) throw ApiError.validationError('Category name already exists', 'categoryName');
      category.categoryName = data.categoryName;
      category.slug = toSlug(data.categoryName);
    }

    if (data.isActive !== undefined) category.isActive = data.isActive;
    await category.save();

    logger.info('Category updated', { id });
    return category;
  },

  async delete(id: string) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

     const mediaList = await Media.find({ categoryId: id }).select('+publicId').lean();
    await Promise.allSettled(
      mediaList.map(m => cloudinary.uploader.destroy(m.publicId, { resource_type: m.mediaType === 'image' ? 'image' : 'video' }))
    );
    await Media.deleteMany({ categoryId: id });
    await category.deleteOne();

    logger.info('Category and all media deleted', { id });
    return { message: 'Category deleted successfully' };
  },
};

 
export const mediaService = {

  async upload(
    userId: string,
    categoryId: string,
    name: string,
    status: 'active' | 'inactive',
    file: Express.Multer.File,
  ) {
     const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound('Category not found');

     const mediaType = ALLOWED_MIMETYPES[file.mimetype];
    if (!mediaType) {
      throw new ApiError(400, 'INVALID_FILE_TYPE', 'Only SVG, PNG, JPG, MP4, MP3 files are allowed');
    }

     if (file.size > 10 * 1024 * 1024) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'File size cannot exceed 10MB');
    }

    const resourceType = mediaType === 'image' ? 'image' : 'video';
    const publicId = `media_${userId}_${Date.now()}`;

    const uploaded = await uploadToCloudinary(file.buffer, publicId, resourceType);

    const media = await Media.create({
      categoryId,
      name,
      url:          uploaded.url,
      publicId:     uploaded.publicId,
      mediaType,
      originalName: file.originalname,
      size:         uploaded.size,
      status,
      uploadedBy:   userId,
    });

    logger.info('Media uploaded', { id: media._id, categoryId, mediaType });
    return Media.findById(media._id).populate('categoryId', 'categoryName').lean();
  },

  async list(query: { page: number; limit: number; categoryId?: string; status?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.status)     filter.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      Media.find(filter)
        .populate('categoryId', 'categoryName slug')
        .populate('uploadedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Media.countDocuments(filter),
    ]);

    return {
      media: items,
      pagination: {
        total, page: query.page, limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
      },
    };
  },

  async getById(id: string) {
    const media = await Media.findById(id)
      .populate('categoryId', 'categoryName slug')
      .populate('uploadedBy', 'firstName lastName')
      .lean();
    if (!media) throw ApiError.notFound('Media not found');
    return media;
  },

  async update(id: string, data: { categoryId?: string; status?: 'active' | 'inactive' }) {
    if (data.categoryId) {
      const cat = await Category.findById(data.categoryId);
      if (!cat) throw ApiError.notFound('Category not found');
    }

    const media = await Media.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('categoryId', 'categoryName slug')
      .lean();

    if (!media) throw ApiError.notFound('Media not found');
    logger.info('Media updated', { id });
    return media;
  },

  async delete(id: string) {
    const media = await Media.findById(id).select('+publicId');
    if (!media) throw ApiError.notFound('Media not found');

    const resourceType = media.mediaType === 'image' ? 'image' : 'video';
    await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType }).catch(() =>
      logger.warn('Cloudinary delete failed', { publicId: media.publicId })
    );

    await media.deleteOne();
    logger.info('Media deleted', { id });
    return { message: 'Media deleted successfully' };
  },
};
