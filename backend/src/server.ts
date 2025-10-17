import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import Job from './models/Job';
import User from './models/User';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'frontend', 'views'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.render('index', { title: 'HireMate Home', heading: 'Welcome to HireMate!' });
});

// Route to display all jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('client', 'username email');
    res.render('jobs', { title: 'Available Jobs', jobs });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Route to display single job details
app.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'username email')
      .populate('applicants.user', 'username email')
      .populate('comments.user', 'username email');

    if (!job) {
      return res.status(404).render('404', { title: 'Job Not Found' }); // Render a 404 page
    }

    res.render('job_details', { title: job.title, job });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// New EJS routes for Login and Signup pages
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up' }));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
