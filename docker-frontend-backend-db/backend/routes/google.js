const express = require('express');
const { google } = require('googleapis');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Step 1: Start OAuth flow
router.get('/auth', auth, (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: req.user._id.toString(),
    prompt: 'consent',
  });
  res.json({ url });
});

// Step 2: Handle OAuth callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const userId = req.query.state;
    
    // Store tokens in user document
    await User.findByIdAndUpdate(userId, {
      googleTokens: tokens
    });
    
    res.send('Google Calendar connected! You can close this tab and return to the app.');
  } catch (error) {
    console.error('Error storing Google tokens:', error);
    res.status(500).send('Error connecting Google Calendar');
  }
});

// Step 3: Sync events to Google Calendar
router.post('/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.googleTokens) {
      return res.status(401).json({ error: 'Google account not connected.' });
    }

    oAuth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
    const events = await Event.find({ user: req.user._id });
    for (const ev of events) {
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: ev.title,
          description: ev.description,
          start: { dateTime: ev.startDate.toISOString() },
          end: { dateTime: ev.endDate.toISOString() },
        },
      });
    }
    res.json({ message: 'Events synced to Google Calendar!' });
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({ error: 'Failed to sync events with Google Calendar' });
  }
});

module.exports = router; 