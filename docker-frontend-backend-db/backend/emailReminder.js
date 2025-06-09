const nodemailer = require('nodemailer');
const nodeCron = require('node-cron');
const Todo = require('./models/todo');
const User = require('./models/User');

// Configure your email transport (use environment variables in production)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send reminder email
async function sendReminderEmail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

// Schedule a job to run every hour
nodeCron.schedule('* * * * *', async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  // Find todos due in the next hour and still in progress
  const todos = await Todo.find({
    due_date: { $gte: now, $lte: soon },
    status: 'In Progress',
  }).populate('user');

  for (const todo of todos) {
    if (todo.user && todo.user.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #2563eb; color: #fff; padding: 20px 30px;">
            <h2 style="margin: 0;">⏰ Task Reminder</h2>
          </div>
          <div style="padding: 24px 30px; background: #fafbfc;">
            <p style="font-size: 16px;">Hi <b>${todo.user.firstName || ''}</b>,</p>
            <p style="font-size: 16px;">This is a friendly reminder that your task <b>"${todo.title}"</b> is due soon!</p>
            <ul style="font-size: 15px; color: #333;">
              <li><b>Due Date:</b> {todo.due_date && !isNaN(new Date(todo.due_date)) ? new Date(todo.due_date).toLocaleString() : 'No due date'}</li>
              <li><b>Priority:</b> ${todo.priority}</li>
              <li><b>Status:</b> ${todo.status}</li>
            </ul>
            ${todo.description ? `<p style='margin-top: 10px;'><b>Description:</b> ${todo.description}</p>` : ''}
            <div style="margin-top: 24px;">
              <a href="http://localhost/todos" style="background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 4px; text-decoration: none; font-weight: bold;">Go to your Todo App</a>
            </div>
            <p style="margin-top: 32px; color: #888; font-size: 13px;">Please complete your task before the deadline.<br/>Best regards,<br/>Your Todo App Team</p>
          </div>
        </div>
      `;
      if (!todo.due_date || isNaN(new Date(todo.due_date))) {
        console.warn('Skipping todo with invalid due_date:', todo);
        continue;
      }
      await sendReminderEmail(
        todo.user.email,
        `⏰ Reminder: Task "${todo.title}" is due soon!`,
        html
      );
    }
  }
});

module.exports = {};