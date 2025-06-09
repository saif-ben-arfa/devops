const express = require('express');
const router = express.Router();
const Note = require('../models/Notes');
const auth = require('../middleware/auth');

// Get all notes for user
router.get('/', auth, async (req, res) => {
  const notes = await Note.find({ user: req.user._id }).sort({ pinned: -1, order: 1, updatedAt: -1 });
  res.json(notes);
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// Create note
router.post('/', auth, async (req, res) => {
  const note = new Note({
    title: req.body.title || 'Untitled Note',
    content: req.body.content || { type: 'doc', content: [] },
    tags: req.body.tags || [],
    pinned: req.body.pinned || false,
    order: req.body.order || 0,
    user: req.user._id
  });
  await note.save();
  res.status(201).json(note);
});

// Update note
router.patch('/:id', auth, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (req.body.title !== undefined) note.title = req.body.title;
  if (req.body.content !== undefined) note.content = req.body.content;
  if (req.body.tags !== undefined) note.tags = req.body.tags;
  if (req.body.pinned !== undefined) note.pinned = req.body.pinned;
  if (req.body.order !== undefined) note.order = req.body.order;
  await note.save();
  res.json(note);
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json({ message: 'Note deleted' });
});

module.exports = router;
