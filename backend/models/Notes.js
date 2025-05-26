const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, default: 'Untitled Note' },
  content: { type: Object, default: { type: 'doc', content: [] } },
  tags: [{ type: String }],
  pinned: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
