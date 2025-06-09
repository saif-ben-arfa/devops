const express = require("express");
const router = express.Router();
const Todo = require("../models/todo");
const auth = require("../middleware/auth");

// GET all todos for the authenticated user
router.get("/", auth, async (req, res) => {
  const todos = await Todo.find({ user: req.user._id });
  res.send(todos);
});

// GET todo based on ID (only if owned by user)
router.get("/:id", auth, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
  if (!todo) return res.status(404).send({ error: "Todo not found" });
  res.send(todo);
});

// POST create new todo
router.post("/", auth, async (req, res) => {
  const todo = new Todo({
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority || 'Medium',
    due_date: req.body.due_date ? new Date(req.body.due_date) : undefined,
    status: req.body.status || 'In Progress',
    user: req.user._id
  });
  await todo.save();
  res.send(todo);
});

// UPDATE todo (only if owned by user)
router.patch("/:id", auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).send({ error: "Todo not found" });
    if (req.body.title !== undefined) todo.title = req.body.title;
    if (req.body.description !== undefined) todo.description = req.body.description;
    if (req.body.priority !== undefined) todo.priority = req.body.priority;
    if (req.body.status !== undefined) todo.status = req.body.status;
    if (req.body.due_date !== undefined) todo.due_date = new Date(req.body.due_date);
    await todo.save();
    res.send(todo);
  } catch {
    res.status(404).send({ error: "Todo does not exist!" });
  }
});

// DELETE todo (only if owned by user)
router.delete("/:id", auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).send({ error: "Todo not found" });
    res.status(204).send();
  } catch {
    res.status(404).send({ error: "Todo does not exist!" });
  }
});

module.exports = router;
