import { ExposurePlan } from './exposure.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

/* ── Pre-defined behaviors (therapist-configured) ────────── */
const DEFAULT_BEHAVIORS: string[] = [
  'Avoiding social situations',
  'Checking doors repeatedly',
  'Procrastinating on important tasks',
  'Avoiding conflicts',
  'Repeatedly seeking reassurance from others',
];

export const exposureService = {

  /* ─── 1. GET available behaviors ───────────────────────── */
  async getBehaviors() {
    return DEFAULT_BEHAVIORS;
  },

  /* ─── 2. CREATE exposure plan ──────────────────────────── */
  async createPlan(
    userId: string,
    data: { selectedBehavior: string; hierarchy: { step: string; suds: number }[] }
  ) {
    // Sort hierarchy by SUDS ascending (easiest first)
    const sortedHierarchy = [...data.hierarchy].sort((a, b) => a.suds - b.suds);

    const plan = await ExposurePlan.create({
      userId,
      selectedBehavior: data.selectedBehavior,
      hierarchy: sortedHierarchy.map(h => ({
        step: h.step,
        suds: h.suds,
        originalSuds: h.suds,   // fixed reference point for SUDS improvement tracking
        currentSuds: undefined,
        completed: false,
        attempts: 0,
        mastered: false,
      })),
      currentWeek: 1,
      progressPercent: 0,
      status: 'not_started',
    });

    logger.info('Exposure plan created', { id: plan._id, userId });
    return plan;
  },

  /* ─── 3. GET plan by ID (with ownership check) ─────────── */
  async getPlanById(planId: string, userId: string) {
    const plan = await ExposurePlan.findById(planId).lean();
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');
    return plan;
  },

  /* ─── 4. GET all plans for a user ──────────────────────── */
  async getUserPlans(userId: string) {
    return ExposurePlan.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  },

  /* ─── 5. UPDATE step completion ────────────────────────── */
  async updateStep(
    planId: string,
    userId: string,
    data: { stepIndex: number; completed: boolean }
  ) {
    const plan = await ExposurePlan.findById(planId);
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    if (data.stepIndex < 0 || data.stepIndex >= plan.hierarchy.length) {
      throw ApiError.validationError('Invalid step index');
    }

    // Update step
    plan.hierarchy[data.stepIndex].completed = data.completed;
    plan.hierarchy[data.stepIndex].completedAt = data.completed ? new Date() : undefined;

    // Recalculate progress
    const completedCount = plan.hierarchy.filter(s => s.completed).length;
    const totalSteps = plan.hierarchy.length;
    plan.progressPercent = Math.round((completedCount / totalSteps) * 100);

    // Update status
    if (completedCount === 0) {
      plan.status = 'not_started';
    } else if (completedCount === totalSteps) {
      plan.status = 'completed';
    } else {
      plan.status = 'in_progress';
    }

    // Update current week (1-based index of next incomplete step)
    const nextIncompleteIdx = plan.hierarchy.findIndex(s => !s.completed);
    plan.currentWeek = nextIncompleteIdx === -1 ? totalSteps : nextIncompleteIdx + 1;

    await plan.save();

    logger.info('Exposure step updated', {
      planId,
      stepIndex: data.stepIndex,
      completed: data.completed,
      progress: plan.progressPercent,
    });

    return plan;
  },

  /* ─── 6. GET progress summary ──────────────────────────── */
  async getProgress(planId: string, userId: string) {
    const plan = await ExposurePlan.findById(planId).lean();
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    const completedSteps = plan.hierarchy.filter(s => s.completed).length;
    const totalSteps = plan.hierarchy.length;

    return {
      planId: plan._id,
      selectedBehavior: plan.selectedBehavior,
      progress: `${plan.progressPercent}%`,
      completedSteps,
      totalSteps,
      currentWeek: plan.currentWeek,
      status: plan.status,
      hierarchy: plan.hierarchy.map((s, i) => ({
        index: i,
        step: s.step,
        suds: s.suds,
        completed: s.completed,
        completedAt: s.completedAt || null,
      })),
    };
  },

  /* ─── 7. DELETE plan ───────────────────────────────────── */
  async deletePlan(planId: string, userId: string) {
    const plan = await ExposurePlan.findById(planId);
    if (!plan) throw ApiError.notFound('Exposure plan not found');
    if (plan.userId.toString() !== userId) throw ApiError.forbidden('Access denied');

    await ExposurePlan.findByIdAndDelete(planId);
    logger.info('Exposure plan deleted', { planId, userId });
    return { message: 'Exposure plan deleted successfully' };
  },
};
