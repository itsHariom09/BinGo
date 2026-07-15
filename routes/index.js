const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');

// =======================
// Home Page
// =======================
router.get('/', ensureGuest, (req, res) => {
    res.render('index', {
        title: 'Bingo - Smart Waste Management',
        user: req.session.user || null,
        role: req.session.role || null
    });
});

// =======================
// About Page
// =======================
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Bingo',
        user: req.session.user || null,
        role: req.session.role || null
    });
});

module.exports = router;