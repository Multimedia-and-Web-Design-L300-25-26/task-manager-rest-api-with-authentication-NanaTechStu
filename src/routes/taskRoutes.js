import express from 'express';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all task routes
router.use(authMiddleware);

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = new Task({
      title,
      description,
      owner: req.user._id,
      completed: false
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// GET /api/tasks - Get user's tasks only
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// DELETE /api/tasks/:id - Delete task with ownership check
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized to delete' });
    }

    res.status(200).json({ message: 'Task deleted successfully', task });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

export default router;