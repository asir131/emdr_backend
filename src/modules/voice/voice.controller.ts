import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { generateVoiceAudio } from './voice.service';

export const voiceController = {
  createAudio: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await generateVoiceAudio(req.body.text, req.body.cacheNamespace);

      if (!result) {
        res.status(503).json({
          success: false,
          message: 'Natural voice audio is temporarily unavailable.',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  },
};
