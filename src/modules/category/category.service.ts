import { Category } from './category.model';
import { IBilateralAudioProfile, Media, MediaDefaultFacing } from './media.model';
import { ApiError } from '../../utils/ApiError';
import { cloudinary } from '../../config/cloudinary';
import { logger } from '../../config/logger';


const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const ALLOWED_MIMETYPES: Record<string, string> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'image/gif': 'image',
  'video/mp4': 'video',
  'video/mpeg': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/aac': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'audio/flac': 'audio',
  'audio/x-m4a': 'audio',
};

const uploadToCloudinary = (
  buffer: Buffer,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw',
): Promise<{ url: string; publicId: string; size: number }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        resource_type: resourceType,
        folder: 'my-emdr/media',
        chunk_size: 6000000,
        timeout: 600000, // 10 minutes — prevents timeout on large uploads
        ...(resourceType === 'image' && {
          transformation: [
            { quality: 'auto:best', fetch_format: 'auto' },
          ],
        }),
      },
      (err, result) => {
        if (err || !result) {
          logger.error('Cloudinary upload failed', { error: err?.message || err, publicId });
          return reject(new ApiError(500, 'UPLOAD_FAILED', `File upload failed: ${err?.message || 'Unknown error'}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
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

  async getCategoryMedia(categoryId: string) {
    const category = await Category.findById(categoryId).lean();
    if (!category) throw ApiError.notFound('Category not found');

    const mediaList = await Media.find({ categoryId, status: 'active' })
      .select('name url mediaType duration size imageProfile videoProfile musicProfile defaultFacing bilateralAudioProfile createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const images = mediaList.filter(m => m.mediaType === 'image');
    const videos = mediaList.filter(m => m.mediaType === 'video');
    const musics = mediaList.filter(m => m.mediaType === 'audio');
    const others = mediaList.filter(m => !['image', 'video', 'audio'].includes(m.mediaType || ''));

    return {
      category: {
        id: category._id,
        name: category.categoryName,
        slug: category.slug,
      },
      media: {
        images,
        videos,
        musics,
        others, // To show any files that don't fit the above categories
      },
      totalCount: mediaList.length,
    };
  },
};


export const mediaService = {

  async upload(
    userId: string,
    categoryId: string,
    name: string,
    status: 'active' | 'inactive',
    file: Express.Multer.File,
    profileFiles?: {
      imageProfile?: Express.Multer.File;
      videoProfile?: Express.Multer.File;
      musicProfile?: Express.Multer.File;
    },
    bilateralAudioProfile?: IBilateralAudioProfile,
    defaultFacing?: MediaDefaultFacing,
  ) {
    const category = await Category.findById(categoryId);
    if (!category) throw ApiError.notFound('Category not found');

    let mediaType = (ALLOWED_MIMETYPES[file.mimetype] || 'raw') as any;

    // Fallback: Check extension if mimetype is unknown
    if (mediaType === 'raw') {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext!)) mediaType = 'image';
      else if (['mp4', 'mpeg', 'mov', 'avi', 'webm'].includes(ext!)) mediaType = 'video';
      else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext!)) mediaType = 'audio';
    }

    if (file.size > 400 * 1024 * 1024) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'File size cannot exceed 400MB');
    }

    const resourceType = mediaType === 'image' ? 'image' : mediaType === 'video' || mediaType === 'audio' ? 'video' : 'raw';
    const publicId = `media_${userId}_${Date.now()}`;

    const uploaded = await uploadToCloudinary(file.buffer, publicId, resourceType);

    // ── Upload profile files in parallel ─────────────────────────────────────
    const getResourceType = (file: Express.Multer.File): 'image' | 'video' | 'raw' => {
      const mime = file.mimetype;
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/') || mime.startsWith('audio/')) return 'video';
      return 'raw';
    };

    const [imgProfile, vidProfile, musProfile] = await Promise.all([
      profileFiles?.imageProfile
        ? uploadToCloudinary(
            profileFiles.imageProfile.buffer,
            `${publicId}_imgProfile`,
            getResourceType(profileFiles.imageProfile)
          )
        : Promise.resolve(null),
      profileFiles?.videoProfile
        ? uploadToCloudinary(
            profileFiles.videoProfile.buffer,
            `${publicId}_vidProfile`,
            getResourceType(profileFiles.videoProfile)
          )
        : Promise.resolve(null),
      profileFiles?.musicProfile
        ? uploadToCloudinary(
            profileFiles.musicProfile.buffer,
            `${publicId}_musProfile`,
            getResourceType(profileFiles.musicProfile)
          )
        : Promise.resolve(null),
    ]);

    const media = await Media.create({
      categoryId,
      name,
      url:          uploaded.url,
      publicId:     uploaded.publicId,
      mediaType,
      originalName: file.originalname,
      size:         uploaded.size,
      status,
      defaultFacing,
      uploadedBy:   userId,
      bilateralAudioProfile,
      imageProfile: imgProfile ? { url: imgProfile.url, publicId: imgProfile.publicId, size: imgProfile.size } : undefined,
      videoProfile: vidProfile ? { url: vidProfile.url, publicId: vidProfile.publicId, size: vidProfile.size } : undefined,
      musicProfile: musProfile ? { url: musProfile.url, publicId: musProfile.publicId, size: musProfile.size } : undefined,
    });

    logger.info('Media uploaded', { id: media._id, categoryId, mediaType });
    return Media.findById(media._id).populate('categoryId', 'categoryName').lean();
  },

  async list(query: { page: number; limit: number; categoryId?: string; status?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.status) filter.status = query.status;

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

  async update(id: string, data: { categoryId?: string; status?: 'active' | 'inactive'; defaultFacing?: MediaDefaultFacing; bilateralAudioProfile?: IBilateralAudioProfile }) {
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
