import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import Job from './models/Job'; // Import Job model

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

// New route to display jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('client', 'username email');
    res.render('jobs', { title: 'Available Jobs', jobs });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
