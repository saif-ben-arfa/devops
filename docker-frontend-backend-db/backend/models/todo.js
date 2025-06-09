const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let Todo = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    due_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['In Progress', 'Completed', 'Failed'],
        default: 'In Progress'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Todo', Todo);