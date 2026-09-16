import mongoose from 'mongoose';

/**
 * Job
 * -----
 * "location" is the coarse public area shown on the board (e.g. "Indiranagar,
 * Bengaluru"). "address" is the precise pinpoint address + coordinates and is
 * intentionally only sent to the frontend once a worker has been accepted for
 * the job (see jobController.getJobById) — that's what unlocks the map.
 */
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true }, // coarse, always public
    address: { type: String, default: '' }, // precise, revealed after accept
    lat: { type: Number },
    lng: { type: Number },
    duration: { type: String, required: true },
    pay: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },

    postedBy: { type: String, required: true }, // employer display name
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['open', 'assigned', 'completed', 'paid'],
      default: 'open',
    },

    assignedApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
    assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    rating: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
