const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Expense = require('./models/Expense');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Protected route middleware
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration attempt with data:', req.body);
    
    const { name, job, dob, salary, gender, username, password } = req.body;

    // Validate required fields
    if (!name || !job || !dob || !salary || !gender || !username || !password) {
      console.log('Missing required fields:', {
        name: !!name,
        job: !!job,
        dob: !!dob,
        salary: !!salary,
        gender: !!gender,
        username: !!username,
        password: !!password
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      console.log('User already exists:', username);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    console.log('Creating new user...');
    const user = await User.create({
      name,
      job,
      dob,
      salary,
      gender,
      username,
      password
    });

    if (user) {
      console.log('User saved to MongoDB:', user);
    } else {
      console.error('User was not saved to MongoDB');
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        job: user.job,
        dob: user.dob,
        salary: user.salary,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        job: user.job,
        dob: user.dob,
        salary: user.salary,
        gender: user.gender
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Expense Routes (Protected)
app.get('/api/expenses', protect, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/expenses', protect, async (req, res) => {
    try {
        const expense = new Expense({
            ...req.body,
            user: req.user._id
        });
        await expense.save();
        console.log('Expense saved to MongoDB:', expense);
        res.status(201).json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/expenses/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await Expense.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve React app for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Connect to MongoDB and start server only after successful connection
connectDB(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 