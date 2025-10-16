import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
    min: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open',
  },
  comments: [CommentSchema], // Add comments array
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Job = mongoose.model('Job', JobSchema);

export default Job;
