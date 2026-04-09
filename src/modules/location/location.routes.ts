import { Router } from 'express';
import { locationController } from './location.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { shareLocationSchema } from './location.validation';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: User Geolocation Services
 */

/**
 * @swagger
 * /api/location:
 *   post:
 *     summary: Share/Update current location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number, example: 23.8103 }
 *               longitude: { type: number, example: 90.4125 }
 *               accuracy: { type: number, example: 15.5 }
 *     responses:
 *       200:
 *         description: Location updated
 */
router.post('/', validate(shareLocationSchema), locationController.share);

/**
 * @swagger
 * /api/location:
 *   get:
 *     summary: Get my last shared location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last known location retrieved
 */
router.get('/',  locationController.getMyLocation);

export default router;
