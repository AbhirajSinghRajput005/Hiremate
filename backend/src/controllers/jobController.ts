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

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Freelancer only)
const applyToJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is a freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can apply to jobs' });
    }

    // Check if freelancer has already applied
    const alreadyApplied = job.applicants.some(
      (applicant: any) => applicant.user.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Add applicant to the job
    job.applicants.push({ user: req.user._id });
    await job.save();

    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Accept an application for a job
// @route   PUT /api/jobs/:jobId/applicants/:applicantId/accept
// @access  Private (Client only, owner of job)
const acceptApplication = async (req: Request, res: Response) => {
  try {
    const { jobId, applicantId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the authenticated user is the client who owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to manage this job' });
    }

    // Check if the authenticated user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can accept applications' });
    }

    const applicant = job.applicants.find(
      (app: any) => app.user.toString() === applicantId
    );

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found for this job' });
    }

    // Only accept if currently pending
    if (applicant.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    applicant.status = 'accepted';

    // Optionally, reject all other pending applications for this job
    job.applicants.forEach((app: any) => {
      if (app.user.toString() !== applicantId && app.status === 'pending') {
        app.status = 'rejected';
      }
    });

    // Set job status to in-progress if not already completed
    if (job.status === 'open') {
      job.status = 'in-progress';
    }

    await job.save();

    res.json({ message: 'Application accepted successfully', job });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Reject an application for a job
// @route   PUT /api/jobs/:jobId/applicants/:applicantId/reject
// @access  Private (Client only, owner of job)
const rejectApplication = async (req: Request, res: Response) => {
  try {
    const { jobId, applicantId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the authenticated user is the client who owns the job
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to manage this job' });
    }

    // Check if the authenticated user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can reject applications' });
    }

    const applicant = job.applicants.find(
      (app: any) => app.user.toString() === applicantId
    );

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found for this job' });
    }

    // Only reject if currently pending
    if (applicant.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    applicant.status = 'rejected';

    await job.save();

    res.json({ message: 'Application rejected successfully', job });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Post a comment on a job
// @route   POST /api/jobs/:id/comments
// @access  Private
const postComment = async (req: Request, res: Response) => {
  const { text } = req.body;
  const { id } = req.params;

  try {
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const comment = {
      user: req.user._id,
      text,
    };

    job.comments.push(comment);
    await job.save();

    // Populate the user field in the newly added comment for the response
    const populatedJob = await Job.findById(id).populate(
      'comments.user', 'username email'
    );
    const newComment = populatedJob?.comments[populatedJob.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

export { createJob, getJobs, getJobById, updateJob, deleteJob, applyToJob, acceptApplication, rejectApplication, postComment };

