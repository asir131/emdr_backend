import { WeeklyReview, IStepReview } from './weeklyReview.model';
import { ExposurePlan } from './exposure.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export const weeklyReviewService = {

  /**
   * Get user's active plan (latest in-progress or not-started plan)
   */
  async getUserActivePlan(userId: string) {
    const plan = await ExposurePlan.findOne({
      userId,
      status: { $in: ['not_started', 'in_progress'] }
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!plan) {
      throw ApiError.notFound('No active exposure plan found. Please create a plan first.');
    }

    return plan;
  },

  /**
   * Get current week review for user's active plan (no planId needed)
   */
  async getCurrentReviewForUser(userId: string) {
    const plan = await this.getUserActivePlan(userId);
    return this.getCurrentReview(plan._id.toString(), userId);
  },

  async getCurrentReview(planId: string, userId: string) {
    const plan = await ExposurePlan.findById(planId).lean();
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    const review = await WeeklyReview.findOne({
      planId,
      weekNumber: plan.currentWeek,
    }).lean();

    return {
      plan: {
        _id: plan._id,
        selectedBehavior: plan.selectedBehavior,
        currentWeek: plan.currentWeek,
        status: plan.status,
        hierarchy: plan.hierarchy,
      },
      review: review ?? null,
    };
  },

  /**
   * Save review for user's active plan (no planId needed)
   */
  async saveReviewForUser(
    userId: string,
    data: {
      weekNumber: number;
      overallFeeling: 'good' | 'challenging' | 'mixed' | 'unable';
      stepReviews: IStepReview[];
    }
  ) {
    const plan = await this.getUserActivePlan(userId);
    return this.saveReview(plan._id.toString(), userId, data);
  },

  async saveReview(
    planId: string,
    userId: string,
    data: {
      weekNumber: number;
      overallFeeling: 'good' | 'challenging' | 'mixed' | 'unable';
      stepReviews: IStepReview[];
    }
  ) {
    const plan = await ExposurePlan.findById(planId);
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    const attempted = data.stepReviews.filter(s => s.status !== 'not-started');
    const completed = data.stepReviews.filter(s => s.status === 'completed');

    const sudsImprovements = data.stepReviews
      .filter(s => s.sudsRating !== undefined && s.sudsRating !== null)
      .map(s => {
        const hierarchyStep = plan.hierarchy[s.stepIndex];
        return hierarchyStep ? hierarchyStep.originalSuds - (s.sudsRating as number) : 0;
      });

    const avgSudsReduction =
      sudsImprovements.length > 0
        ? parseFloat(
            (sudsImprovements.reduce((a, b) => a + b, 0) / sudsImprovements.length).toFixed(1)
          )
        : null;

    const review = await WeeklyReview.findOneAndUpdate(
      { planId, weekNumber: data.weekNumber },
      {
        $set: {
          planId,
          userId,
          weekNumber: data.weekNumber,
          overallFeeling: data.overallFeeling,
          stepReviews: data.stepReviews,
          summary: {
            completedSteps: completed.length,
            attemptedSteps: attempted.length,
            avgSudsReduction,
          },
          isCompleted: true,
        },
      },
      { upsert: true, new: true }
    );

    for (const sr of data.stepReviews) {
      const idx = sr.stepIndex;
      if (idx < 0 || idx >= plan.hierarchy.length) continue;

      if (sr.sudsRating !== undefined) {
        plan.hierarchy[idx].currentSuds = sr.sudsRating;
        plan.hierarchy[idx].mastered = sr.sudsRating <= 2;
        plan.hierarchy[idx].attempts = (plan.hierarchy[idx].attempts ?? 0) + 1;
      }
      if (sr.status === 'completed') {
        plan.hierarchy[idx].completed = true;
        plan.hierarchy[idx].completedAt = new Date();
      }
      if (sr.plannedDay) {
        plan.hierarchy[idx].plannedDay = sr.plannedDay;
      }
    }

    const completedCount = plan.hierarchy.filter(s => s.completed).length;
    const totalSteps = plan.hierarchy.length;
    plan.progressPercent = Math.round((completedCount / totalSteps) * 100);
    plan.status =
      completedCount === 0
        ? 'not_started'
        : completedCount === totalSteps
        ? 'completed'
        : 'in_progress';

    // Consider a step "active" if it has been attempted at least once
    const allMastered = plan.hierarchy
      .filter(s => s.attempts > 0)
      .every(s => s.mastered);
    if (allMastered && plan.status !== 'completed') {
      plan.currentWeek += 1;
    }

    await plan.save();

    logger.info('Weekly review saved', { planId, weekNumber: data.weekNumber, userId });
    return review;
  },

  /**
   * Update step review for user's active plan (no planId needed)
   */
  async updateStepReviewForUser(
    userId: string,
    data: IStepReview & { weekNumber: number }
  ) {
    const plan = await this.getUserActivePlan(userId);
    return this.updateStepReview(plan._id.toString(), userId, data);
  },

  async updateStepReview(
    planId: string,
    userId: string,
    data: IStepReview & { weekNumber: number }
  ) {
    const plan = await ExposurePlan.findById(planId);
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    if (data.stepIndex < 0 || data.stepIndex >= plan.hierarchy.length) {
      throw ApiError.validationError('Invalid step index');
    }

    let review = await WeeklyReview.findOne({ planId, weekNumber: data.weekNumber });

    if (!review) {
      review = await WeeklyReview.create({
        planId,
        userId,
        weekNumber: data.weekNumber,
        overallFeeling: 'mixed',  
        stepReviews: [],
        isCompleted: false,
      });
    }

    const existingIdx = review.stepReviews.findIndex(s => s.stepIndex === data.stepIndex);
    const { weekNumber: _wn, ...stepData } = data;

    if (existingIdx >= 0) {
      review.stepReviews[existingIdx] = stepData;
    } else {
      review.stepReviews.push(stepData);
    }

    await review.save();

    if (data.sudsRating !== undefined) {
      plan.hierarchy[data.stepIndex].currentSuds = data.sudsRating;
      plan.hierarchy[data.stepIndex].mastered = data.sudsRating <= 2;
      plan.hierarchy[data.stepIndex].attempts = (plan.hierarchy[data.stepIndex].attempts ?? 0) + 1;
    }
    if (data.status === 'completed') {
      plan.hierarchy[data.stepIndex].completed = true;
      plan.hierarchy[data.stepIndex].completedAt = new Date();
    }
    if (data.plannedDay) {
      plan.hierarchy[data.stepIndex].plannedDay = data.plannedDay;
    }
    await plan.save();

    logger.info('Step review updated', { planId, stepIndex: data.stepIndex, userId });
    return review;
  },

  async getReviewHistory(planId: string, userId: string) {
    const plan = await ExposurePlan.findById(planId).lean();
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    const reviews = await WeeklyReview.find({ planId })
      .sort({ weekNumber: 1 })
      .lean();

    return {
      planId,
      selectedBehavior: plan.selectedBehavior,
      totalWeeks: plan.currentWeek,
      reviews,
    };
  },
};
