import { cloudinary } from '../config/cloudinary';
import { logger } from '../config/logger';

/**
 * Upload a file buffer to Cloudinary
 * Returns the secure URL of the uploaded image
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:      publicId,
        overwrite:      true,
        resource_type:  'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload failed', { error });
          return reject(new Error('Image upload failed'));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by URL
 */
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const folder = parts[parts.length - 2];
    const filename = parts[parts.length - 1].split('.')[0];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.warn('Cloudinary delete failed', { imageUrl });
  }
};
