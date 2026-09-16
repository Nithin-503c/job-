import mongoose from 'mongoose';

/**
 * WorkerPerformance
 * -------------------
 * One document = one job completed by one worker, plus how they performed.
 * Field names intentionally mirror the job object already used in the
 * frontend's AppContext.jsx (title, category, pay, postedBy, rating).
 */
const workerPerformanceSchema = new mongoose.Schema(
  {
    // Who did the job
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workerName: {
      type: String,
      required: true,
      trim: true,
    },
    workerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Which job they did
    jobId: {
      type: String, // matches the frontend's job.id (e.g. 'j1', 'j2-171...')
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },

    // Who hired them
    employerName: {
      type: String,
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Job outcome
    status: {
      type: String,
      enum: ['completed', 'incomplete', 'cancelled'],
      default: 'completed',
    },
    payAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },

    // Performance rating given by the employer after job completion
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

// Speeds up "show me this worker's full job/rating history" queries
workerPerformanceSchema.index({ workerId: 1, completedAt: -1 });

// Convenience static: average rating for a given worker
workerPerformanceSchema.statics.getAverageRating = async function (workerId) {
  const result = await this.aggregate([
    { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
    {
      $group: {
        _id: '$workerId',
        averageRating: { $avg: '$rating' },
        totalJobs: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { averageRating: null, totalJobs: 0 };
};

const WorkerPerformance = mongoose.model('WorkerPerformance', workerPerformanceSchema);

export default WorkerPerformance;
