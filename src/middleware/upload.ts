import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

// Store in memory — we stream directly to Cloudinary
const storage = multer.memoryStorage();

export const uploadProfilePic = multer({
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
}).single('profilePic');
