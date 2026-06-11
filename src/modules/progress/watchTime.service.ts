import mongoose from 'mongoose';
import { WatchTime } from './watchTime.model';

export const watchTimeService = {
  /**
   * Log time spent (Heartbeat system)
   * seconds: how many seconds spent since last heartbeat (e.g. 30)
   */
  async logTime(userId: string, journeyId: string, seconds: number) {
    const today = new Date().toISOString().split('T')[0];

    const watchTime = await WatchTime.findOneAndUpdate(
      { userId, journeyId, date: today },
      { 
        $inc: { totalSeconds: seconds },
        $set: { lastActive: new Date() }
      },
      { upsert: true, new: true }
    );

    return {
      date: watchTime.date,
      totalSpentToday: this.formatTime(watchTime.totalSeconds),
      totalSecondsToday: watchTime.totalSeconds
    };
  },

  /**
   * Get total watch time for a user on a specific journey (all time)
   */
  async getJourneyTotalTime(userId: string, journeyId: string) {
    const stats = await WatchTime.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          journeyId: new mongoose.Types.ObjectId(journeyId) 
        } 
      },
      { $group: { _id: null, totalSeconds: { $sum: "$totalSeconds" } } }
    ]);

    const totalSeconds = stats.length > 0 ? stats[0].totalSeconds : 0;
    return {
      journeyId,
      totalWatchTime: this.formatTime(totalSeconds),
      totalSeconds
    };
  },

  /**
   * Get daily stats for the last 7 days
   */
  async getWeeklyStats(userId: string) {
    const stats = await WatchTime.find({ userId })
      .sort({ date: -1 })
      .limit(7)
      .lean();

    return stats.map(s => ({
      date: s.date,
      time: this.formatTime(s.totalSeconds),
      seconds: s.totalSeconds
    }));
  },

  /**
   * Helper to format seconds to "HH:MM:SS" or "MMm SSs"
   */
  formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
};
