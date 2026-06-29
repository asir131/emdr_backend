import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { voiceController } from './voice.controller';
import { createVoiceAudioSchema } from './voice.validation';

const router = Router();

router.use(authenticate);
router.post('/tts', validate(createVoiceAudioSchema), voiceController.createAudio);

export default router;
