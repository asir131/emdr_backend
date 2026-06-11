import { User } from '../auth/auth.model';
import { UserSubscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/subscription.model';
import { Journey } from '../journey/journey.model';
import { SessionProgress } from '../progress/sessionProgress.model';
import { WatchTime } from '../progress/watchTime.model';
import { Payment } from '../payment/payment.model';
import { Assessment } from '../assessment/assessment.model';
import { ApiError } from '../../utils/ApiError';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/uploadImage';

export const adminService = {

  /**
   * GET Admin Dashboard Overview Data with REAL REVENUE TREND
   */
  async getDashboardStats() {
    const totalUsers = await User.countDocuments({ role: 'user', isDeleted: false });
    const activeUsers = await User.countDocuments({ role: 'user', isDeleted: false, status: 'active' });
    const inactiveUsers = totalUsers - activeUsers;

    const activeSubscriptions = await UserSubscription.countDocuments({ status: SubscriptionStatus.ACTIVE });
    const totalPossibleUsers = await User.countDocuments({ role: 'user' });
    const conversionRate = totalPossibleUsers > 0 ? (activeSubscriptions / totalPossibleUsers) * 100 : 0;

    const totalRoadmaps = await Journey.countDocuments({ isActive: true });
    const aiRoadmaps = Math.round(totalRoadmaps * 0.78); 
    const psychologistRoadmaps = totalRoadmaps - aiRoadmaps;

    const completionStats = await SessionProgress.aggregate([
      { $group: { _id: null, avgCompletion: { $avg: { $toDouble: { $replaceOne: { input: "$progressPercentage", find: "%", replacement: "" } } } } } }
    ]);
    const avgSessionCompletion = completionStats.length > 0 ? Math.round(completionStats[0].avgCompletion) : 0;

    const mrrStats = await UserSubscription.aggregate([
      { $match: { status: SubscriptionStatus.ACTIVE } },
      { $lookup: { from: 'subscriptionplans', localField: 'planId', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: null, totalMRR: { $sum: '$plan.price' } } }
    ]);
    const totalMRR = mrrStats.length > 0 ? mrrStats[0].totalMRR : 0;

    // --- REAL REVENUE TREND (Last 12 Months from Payment Collection) ---
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const realRevenueTrend = await Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const matched = realRevenueTrend.find(r => r._id.year === y && r._id.month === m);
        trend.push({ month: monthsShort[d.getMonth()], value: matched ? Math.round(matched.revenue) : 0 });
    }

    const distribution = await UserSubscription.aggregate([
      { $match: { status: SubscriptionStatus.ACTIVE } },
      { $lookup: { from: 'subscriptionplans', localField: 'planId', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $group: { _id: '$p.name', userCount: { $sum: 1 }, price: { $first: '$p.price' }, currency: { $first: '$p.currency' } } },
      { $project: { planName: '$_id', userCount: 1, pricePerMonth: { $concat: ['$currency', { $toString: '$price' }, '/Month'] } } },
      { $sort: { price: -1 } }
    ]);

    return {
      overview: {
        totalUsers: { count: totalUsers, active: activeUsers, inactive: inactiveUsers, growth: '+15%' },
        activeSubscriptions: { count: activeSubscriptions, conversionRate: `${conversionRate.toFixed(1)}%`, growth: '+15%' },
        roadmapsCreated: { count: totalRoadmaps, ai: aiRoadmaps, psychologist: psychologistRoadmaps, growth: '+15%' },
        sessionCompletion: { rate: `${avgSessionCompletion}%`, growth: '+15%' }
      },
      revenue: { mrr: totalMRR, currency: '£', growth: '+15%', trend: trend },
      subscriptionDistribution: distribution
    };
  },

  /**
   * GET All Users (FOR TABLE)
   */
  async getAllUsers(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query: any = { role: 'user', isDeleted: false };
    if (search) {
      query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await User.countDocuments(query);

    const enrichedUsers = await Promise.all(users.map(async (u) => {
      const sub = await UserSubscription.findOne({ userId: u._id, status: SubscriptionStatus.ACTIVE }).populate('planId', 'name').lean();
      const progress = await SessionProgress.findOne({ userId: u._id }).sort({ updatedAt: -1 }).lean();
      return { id: u._id, userName: `${u.firstName} ${u.lastName}`, email: u.email, subscription: sub ? (sub.planId as any)?.name : 'Free', roadmapType: progress ? 'Personalized' : 'None', sessionProgress: progress ? progress.progressPercentage : '0%', status: u.status || 'active', joinedDate: u.createdAt };
    }));

    return { users: enrichedUsers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  /**
   * GET Single User Detailed Info
   */
  async getUserDetails(userId: string) {
    const user = await User.findOne({ _id: userId, isDeleted: false }).lean();
    if (!user) throw ApiError.userNotFound();
    const sub = await UserSubscription.findOne({ userId: user._id }).populate('planId').sort({ createdAt: -1 }).lean();
    const progress = await SessionProgress.find({ userId: user._id }).lean();
    const totalCompleted = progress.reduce((acc, curr) => acc + curr.completedSessions, 0);
    const avgProgress = progress.length > 0 ? Math.round(progress.reduce((acc, curr) => acc + parseInt(curr.progressPercentage), 0) / progress.length) : 0;
    const lastActive = await WatchTime.findOne({ userId: user._id }).sort({ lastActive: -1 }).lean();

    return {
      userId: `USER-${user._id.toString().slice(-4).toUpperCase()}`,
      email: user.email,
      roadmapType: 'Psychologist',
      sessionsCompleted: totalCompleted,
      subscriptionPlan: sub ? `${(sub.planId as any)?.name} (${(sub.planId as any)?.type})` : 'Free',
      status: user.status || 'active',
      joinedDate: user.createdAt,
      lastActive: lastActive ? lastActive.lastActive : user.updatedAt,
      overallProgress: `${avgProgress}%`
    };
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    const user = await User.findOneAndUpdate({ _id: userId }, { status }, { new: true });
    if (!user) throw ApiError.userNotFound();
    return { id: user._id, status: user.status };
  },

  async getProfile(adminId: string) {
    const admin = await User.findOne({ _id: adminId, role: 'admin', isDeleted: false }).lean();
    if (!admin) throw ApiError.userNotFound();
    return { 
      id: admin._id, 
      name: `${admin.firstName} ${admin.lastName}`, 
      email: admin.email, 
      phoneNumber: admin.phoneNumber || "", 
      role: admin.role, 
      avatar: admin.avatar 
    };
  },

  /**
   * GET All Free Users
   * "Free users" = users with no active paid subscription
   * Includes: no plan, community/free plan (active or pending), expired/canceled
   */
  async getFreeUsers(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    // Find all userIds that have an active PAID subscription (standard or premium)
    const paidPlanIds = await SubscriptionPlan.find({
      type: { $in: ['standard', 'premium'] },
      isActive: true,
    }).distinct('_id');

    const paidUserIds = await UserSubscription.find({
      planId: { $in: paidPlanIds },
      status: SubscriptionStatus.ACTIVE,
    }).distinct('userId');

    // Build query: regular users, not deleted, NOT in paid list
    const query: any = {
      role: 'user',
      isDeleted: false,
      _id: { $nin: paidUserIds },
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('firstName lastName email status createdAt avatar')
        .lean(),
      User.countDocuments(query),
    ]);

    // Enrich with their latest subscription info
    const enriched = await Promise.all(
      users.map(async (u) => {
        // Get most recent subscription (any status)
        const sub = await UserSubscription.findOne({ userId: u._id })
          .sort({ createdAt: -1 })
          .populate('planId', 'name type price isCommunityAccess')
          .lean();

        // Determine subscription display status
        let subscriptionInfo;
        if (!sub) {
          subscriptionInfo = { name: 'No Plan', type: 'free', status: 'none', approvalStatus: 'not_applied' };
        } else if (sub.status === SubscriptionStatus.PENDING) {
          subscriptionInfo = {
            name: (sub.planId as any)?.name,
            type: (sub.planId as any)?.type,
            status: 'pending',
            approvalStatus: 'awaiting_admin_approval',
          };
        } else {
          subscriptionInfo = {
            name: (sub.planId as any)?.name,
            type: (sub.planId as any)?.type,
            status: sub.status,
            approvalStatus: sub.status === SubscriptionStatus.ACTIVE ? 'approved' : sub.status,
          };
        }

        return {
          id:           u._id,
          name:         `${u.firstName} ${u.lastName}`,
          email:        u.email,
          avatar:       u.avatar || null,
          status:       u.status || 'active',
          joinedDate:   u.createdAt,
          subscription: subscriptionInfo,
        };
      })
    );

    return {
      users: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * GET User Assessment Results by userId (Admin)
   * Returns all PHQ-9, GAD-7, DES-11 scores for a specific user
   */
  async getUserAssessments(userId: string) {
    const user = await User.findOne({ _id: userId, isDeleted: false })
      .select('firstName lastName email')
      .lean();
    if (!user) throw ApiError.userNotFound();

    const assessments = await Assessment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = assessments.map((a) => ({
      assessmentId:   a._id,
      status:         a.status,
      isCompleted:    a.isCompleted,
      currentStep:    a.currentStep,
      submittedAt:    a.createdAt,

      phq9: {
        answers:  a.phq9Answers,
        score:    a.phq9Score,
        severity: a.phq9Severity,
      },
      gad7: {
        answers:  a.gad7Answers,
        score:    a.gad7Score,
        severity: a.gad7Severity,
      },
      des11: {
        answers: a.des11Answers,
        score:   a.des11Score,
      },

      totalScore:               a.totalScore,
      requiresProfessionalSupport: a.requiresProfessionalSupport,
      recommendation:           a.recommendation,
    }));

    return {
      user: {
        id:        user._id,
        name:      `${user.firstName} ${user.lastName}`,
        email:     user.email,
      },
      totalAssessments: formatted.length,
      assessments:      formatted,
    };
  },

  async updateProfile(adminId: string, data: { name: string; phoneNumber?: string }, profilePicBuffer?: Buffer) {
    const parts = data.name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ') || parts[0];
    const updateData: Record<string, any> = { firstName, lastName };
    if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;

    if (profilePicBuffer) {
      const existing = await User.findById(adminId).select('avatar').lean();
      updateData.avatar = await uploadToCloudinary(profilePicBuffer, 'my-emdr/admin-avatars', `admin_avatar_${adminId}`);
      if (existing?.avatar) deleteFromCloudinary(existing.avatar).catch(() => {});
    }

    const admin = await User.findOneAndUpdate({ _id: adminId, role: 'admin' }, updateData, { new: true }).lean();
    if (!admin) throw ApiError.userNotFound();
    return { success: true };
  }
};
