import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

const storage = multer.memoryStorage();

const imageUploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new ApiError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG and WebP images are allowed')
      );
    }
    cb(null, true);
  },
});

// Named exports — semantically correct per use case
export const uploadProfilePic = imageUploader.single('profilePic');

// Chat image — optional file field, also accepts text-only form-data
export const uploadChatImage = imageUploader.fields([
  { name: 'image', maxCount: 1 },
]);

// General Media Uploader (Image, Video, Audio)
const MEDIA_ALLOWED_TYPES = [
  ...ALLOWED_TYPES,
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'
];

const mediaUploader = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  // No fileFilter: allow all file types
});

export const uploadMediaFile = mediaUploader.single('file');

/**
 * Generic multer instance for custom field configurations.
 */
export const upload = mediaUploader;


