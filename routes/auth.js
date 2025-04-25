const express = require('express');
const router = express.Router();
const Society = require('../models/Society');
const Member = require('../models/Member');
const Collector = require('../models/Collector');
const bcrypt = require('bcryptjs');
const { ensureGuest } = require('../middleware/auth');

// Login Page
router.get('/login', ensureGuest, (req, res) => {
    res.render('auth/login');
});

// Login Handle
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    
    try {
        let user;
        if (role === 'society') {
            user = await Society.findOne({ email });
        } else if (role === 'member') {
            user = await Member.findOne({ email });
        } else if (role === 'collector') {
            user = await Collector.findOne({ email });
        }

        if (!user) {
            return res.render('auth/login', {
                error: 'No account found with this email'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', {
                error: 'Incorrect password'
            });
        }

        req.session.user = user;
        req.session.role = role;
        
        if (role === 'society') {
            res.redirect('/head/dashboard');
        } else if (role === 'member') {
            res.redirect('/member/dashboard');
        } else if (role === 'collector') {
            res.redirect('/collector/dashboard');
        }
    } catch (err) {
        console.error(err);
        res.render('auth/login', {
            error: 'Server error'
        });
    }
});

// Register Society Page
router.get('/register-society', ensureGuest, (req, res) => {
    res.render('auth/register-society');
});

// Register Society Handle
router.post('/register-society', async (req, res) => {
    const { name, address, city, pincode, headName, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('auth/register-society', {
            error: 'Passwords do not match'
        });
    }

    try {
        let society = await Society.findOne({ email });
        if (society) {
            return res.render('auth/register-society', {
                error: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        society = new Society({
            name,
            address,
            city,
            pincode,
            headName,
            email,
            password: hashedPassword
        });

        await society.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register-society', {
            error: 'Server error'
        });
    }
});

// Register Collector Page
router.get('/register-collector', ensureGuest, (req, res) => {
    res.render('auth/register-collector');
});

// Register Collector Handle
router.post('/register-collector', async (req, res) => {
    const { name, email, phone, area, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('auth/register-collector', {
            error: 'Passwords do not match'
        });
    }

    try {
        let collector = await Collector.findOne({ email });
        if (collector) {
            return res.render('auth/register-collector', {
                error: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        collector = new Collector({
            name,
            email,
            phone,
            area,
            password: hashedPassword
        });

        await collector.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register-collector', {
            error: 'Server error'
        });
    }
});

router.get('/register-society', ensureGuest, (req, res) => {
    res.render('auth/register-society', {
        title: 'Register Society - Bingo'
    });
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;