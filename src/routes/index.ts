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
import chatRoutes from '../modules/chat/chat.routes';
import supportRoutes from '../modules/support/support.routes';
import subscriptionRoutes from '../modules/subscriptions/subscription.routes';
import onboardingRoutes from '../modules/onboarding/onboarding.routes';
import assessmentRoutes from '../modules/assessment/assessment.routes';

import paymentRoutes from '../modules/payment/payment.routes';

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
router.use('/chat', chatRoutes);
router.use('/support', supportRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/payment', paymentRoutes);

export default router;
