import mongoose from 'mongoose';

/**
 * Application
 * -------------
 * Created when a worker applies for a job. Carries a snapshot of the
 * worker's profile (name, photo) and performance stats (average rating,
 * jobs completed) at the moment of applying, so the employer sees a full
 * picture without extra lookups — "the employee should receive a full
 * description of the worker with photo, name, and his performance".
 */
const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerName: { type: String, required: true },
    workerPhotoUrl: { type: String, default: '' },
    workerEmail: { type: String, required: true },

    message: { type: String, trim: true, maxlength: 500, default: '' },

    // Snapshot of performance history at time of applying
    averageRating: { type: Number, default: null },
    totalJobsCompleted: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
