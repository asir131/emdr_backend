import Stripe from 'stripe';
import { Payment } from './payment.model';
import { SubscriptionPlan, UserSubscription, SubscriptionStatus } from '../subscriptions/subscription.model';
import { User } from '../auth/auth.model';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' });

export const paymentService = {

  // Create Payment Intent — called when user taps "Pay £120"
  async createPaymentIntent(userId: string, planId: string) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw ApiError.notFound('Plan not found or inactive');
    if (plan.isCommunityAccess) throw ApiError.validationError('Community plans do not require payment');

    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.userNotFound();

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const existingPayment = await Payment.findOne({ userId }).sort({ createdAt: -1 }).lean();

    if (existingPayment?.stripeCustomerId) {
      stripeCustomerId = existingPayment.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: userId.toString() },
      });
      stripeCustomerId = customer.id;
    }

    // Amount in pence (£120 = 12000 pence)
    const amountInPence = Math.round(plan.price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      customer: stripeCustomerId,
      description: `${plan.name} - Billed monthly`,
      metadata: { userId: userId.toString(), planId: planId.toString() },
      automatic_payment_methods: { enabled: true },
    });

    // Save pending payment record
    await Payment.create({
      userId,
      planId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId,
      amount: plan.price,
      currency: 'gbp',
      status: 'pending',
      description: `${plan.name} - Billed monthly`,
    });

    logger.info('Payment intent created', { userId, planId, intentId: paymentIntent.id });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: plan.price,
      currency: plan.currency,
      plan: {
        id: plan._id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
      },
    };
  },

  // Confirm Payment — called after Flutter Stripe SDK confirms on client
  async confirmPayment(userId: string, paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId.toString()) {
      throw ApiError.forbidden('Payment does not belong to this user');
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) throw ApiError.notFound('Payment record not found');

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'succeeded';
      await payment.save();

      // Activate subscription
      await UserSubscription.updateMany(
        { userId, status: SubscriptionStatus.ACTIVE },
        { status: SubscriptionStatus.CANCELED }
      );

      const subscription = await UserSubscription.create({
        userId,
        planId: payment.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        autoRenew: true,
      });

      payment.subscriptionId = subscription._id as mongoose.Types.ObjectId;
      await payment.save();

      logger.info('Payment succeeded, subscription activated', { userId, subscriptionId: subscription._id });

      return {
        status: 'succeeded',
        message: 'Payment successful. Your subscription is now active.',
        subscriptionId: subscription._id,
      };
    }

    if (paymentIntent.status === 'requires_payment_method') {
      payment.status = 'failed';
      await payment.save();
      throw ApiError.validationError('Payment failed. Please check your card details and try again.');
    }

    return { status: paymentIntent.status, message: 'Payment is being processed.' };
  },

  // Stripe Webhook — handles async payment events
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw ApiError.validationError('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'succeeded' }
      );
      logger.info('Webhook: payment_intent.succeeded', { intentId: intent.id });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: 'failed' }
      );
      logger.info('Webhook: payment_intent.payment_failed', { intentId: intent.id });
    }

    return { received: true };
  },

  // Payment history
  async getHistory(userId: string) {
    return Payment.find({ userId })
      .populate('planId', 'name price currency interval')
      .sort({ createdAt: -1 })
      .lean();
  },
};

// fix mongoose import
import mongoose from 'mongoose';
