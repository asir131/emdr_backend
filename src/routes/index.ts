import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import profileRoutes from '../modules/profile/profile.routes';
import termsRoutes from '../modules/terms/terms.routes';
import privacyRoutes from '../modules/privacy/privacy.routes';
import faqRoutes from '../modules/faq/faq.routes';
import aboutRoutes from '../modules/about/about.routes';
import adminRoutes from '../modules/admin/admin.routes';
import locationRoutes from '../modules/location/location.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/terms', termsRoutes);
router.use('/privacy', privacyRoutes);
router.use('/faq', faqRoutes);
router.use('/about', aboutRoutes);
router.use('/admin/profile', adminRoutes);
router.use('/location', locationRoutes);

export default router;
