const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');

// Home Page

router.get('/', ensureGuest, (req, res) => {
    res.render('index', { 
      title: 'Bingo - Smart Waste Management',
      user: req.session.user,       // Pass user data
      role: req.session.role        // Pass role data
    });
  });
  
router.get('/', ensureGuest, (req, res) => {
    res.render('index', {
        title: 'Bingo - Smart Waste Management'
    });
});

// About Page (optional)
router.get('/about', ensureGuest, (req, res) => {
    res.render('about', {
        title: 'About Bingo'
    });
});

module.exports = router;