import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('REGISTER ROUTE HIT! Body received:', req.body);

  const { name, email, password } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create and save user (password hashed by pre-save hook)
    user = new User({ name, email, password });
    console.log('User object before save:', user); // ← debug

    await user.save();
    console.log('User saved successfully:', user._id); // ← debug

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    // ──────────────────────────────────────────────
    // Improved detailed logging
    console.error('REGISTER ERROR - FULL DETAILS:');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.errors) console.error('Validation errors:', error.errors);
    console.error('Full error object:', error);
    console.error('Stack trace:', error.stack);
    // ──────────────────────────────────────────────

    res.status(500).json({
      message: 'Server error during registration',
      error: error.message || 'Unknown error',
      // optional: only in development — remove before submission
      details: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('LOGIN ROUTE HIT! Body received:', req.body);

  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload (include user id)
    const payload = {
      id: user._id,   // or _id if you prefer
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // or '1h', '30d' – adjust as needed
    );

    // Return token
    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;