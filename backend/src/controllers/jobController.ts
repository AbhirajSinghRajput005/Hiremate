import { Request, Response } from 'express';
import Job from '../models/Job';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Client only)
const createJob = async (req: Request, res: Response) => {
  const { title, description, budget, deadline, tags } = req.body;

  try {
    const job = new Job({
      title,
      description,
      budget,
      deadline,
      tags,
      client: req.user._id, // Client ID from authenticated user
    });

    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({}).populate('client', 'username email');
    res.json(jobs);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id).populate('client', 'username email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Client only, owner of job)
const updateJob = async (req: Request, res: Response) => {
  const { title, description, budget, deadline, tags, status } = req.body;

  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the authenticated user is the client who owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this job' });
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.budget = budget || job.budget;
    job.deadline = deadline || job.deadline;
    job.tags = tags || job.tags;
    job.status = status || job.status;

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Client only, owner of job)
const deleteJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the authenticated user is the client who owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ message: 'Job removed' });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

export { createJob, getJobs, getJobById, updateJob, deleteJob };
