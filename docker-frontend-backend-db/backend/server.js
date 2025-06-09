const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const todoRoutes = require("./routes/todos");
const adminRoutes = require("./routes/admin");
const googleRoutes = require("./routes/google");
const notesRoutes = require("./routes/notes");
require("./emailReminder");
const session = require('express-session');

dotenv.config();
const port = process.env.PORT || 3001;

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'devsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

  // Health check route for Kubernetes
  app.get('/', (req, res) => {
    res.status(200).send('OK');
  });
// Add this route for /api
  app.get('/api', (req, res) => {
    res.status(200).send('API is working');
  });
  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/todos", todoRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/google", googleRoutes);
  app.use("/api/notes", notesRoutes);

  app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });
}
