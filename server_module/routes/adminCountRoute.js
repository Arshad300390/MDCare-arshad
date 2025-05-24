const express = require('express');
const router = express.Router();
const User = require('../models/user');
const School = require('../models/school');
const Consultant = require('../models/consultant');
const Waitinglistconsultant = require("../models/waitinglistconsultant");
const waitinglist = require('../models/waitinglist');

// Admin counts endpoint
router.get('/counts', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const schools = await School.countDocuments();
    const consultants = await Consultant.countDocuments();
    const consultantsWaiting = await Waitinglistconsultant.countDocuments();
    const schoolsWaiting = await waitinglist.countDocuments();
    res.json({ users, schools, consultants, consultantsWaiting, schoolsWaiting });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;