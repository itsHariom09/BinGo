const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const Society = require('../models/Society');
const Member = require('../models/Member');
const Collector = require('../models/Collector');

const { ensureGuest } = require('../middleware/auth');

// =======================
// Login Page
// =======================
router.get('/login', ensureGuest, (req, res) => {
    res.render('auth/login', {
        title: 'Login - Bingo'
    });
});

// =======================
// Login Handle
// =======================
router.post('/login', ensureGuest, async (req, res) => {
    const { email, password, role } = req.body;

    try {

        if (!email || !password || !role) {
            return res.render('auth/login', {
                title: 'Login - Bingo',
                error: 'Please fill all fields.'
            });
        }

        let user = null;

        switch (role) {
            case 'society':
                user = await Society.findOne({ email });
                break;

            case 'member':
                user = await Member.findOne({ email });
                break;

            case 'collector':
                user = await Collector.findOne({ email });
                break;

            default:
                return res.render('auth/login', {
                    title: 'Login - Bingo',
                    error: 'Invalid user role.'
                });
        }

        if (!user) {
            return res.render('auth/login', {
                title: 'Login - Bingo',
                error: 'No account found with this email.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login - Bingo',
                error: 'Incorrect password.'
            });
        }

        req.session.user = user;
        req.session.role = role;

        switch (role) {
            case 'society':
                return res.redirect('/head/dashboard');

            case 'member':
                return res.redirect('/member/dashboard');

            case 'collector':
                return res.redirect('/collector/dashboard');
        }

    } catch (err) {
        console.error('Login Error:', err);

        res.render('auth/login', {
            title: 'Login - Bingo',
            error: 'Something went wrong. Please try again.'
        });
    }
});

// =======================
// Register Society Page
// =======================
router.get('/register-society', ensureGuest, (req, res) => {
    res.render('auth/register-society', {
        title: 'Register Society - Bingo'
    });
});

// =======================
// Register Society Handle
// =======================
router.post('/register-society', ensureGuest, async (req, res) => {

    const {
        name,
        address,
        city,
        pincode,
        headName,
        email,
        password,
        confirmPassword
    } = req.body;

    try {

        if (
            !name ||
            !address ||
            !city ||
            !pincode ||
            !headName ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            return res.render('auth/register-society', {
                title: 'Register Society - Bingo',
                error: 'Please fill all fields.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register-society', {
                title: 'Register Society - Bingo',
                error: 'Passwords do not match.'
            });
        }

        const existingSociety = await Society.findOne({ email });

        if (existingSociety) {
            return res.render('auth/register-society', {
                title: 'Register Society - Bingo',
                error: 'Email already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const society = new Society({
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

        console.error('Register Society Error:', err);

        res.render('auth/register-society', {
            title: 'Register Society - Bingo',
            error: 'Server error.'
        });

    }

});

// =======================
// Register Collector Page
// =======================
router.get('/register-collector', ensureGuest, (req, res) => {
    res.render('auth/register-collector', {
        title: 'Register Collector - Bingo'
    });
});

// =======================
// Register Collector Handle
// =======================
router.post('/register-collector', ensureGuest, async (req, res) => {

    const {
        name,
        email,
        phone,
        location,
        address,
        password,
        confirmPassword
    } = req.body;

    try {

        if (
            !name ||
            !email ||
            !phone ||
            !location ||
            !address ||
            !password ||
            !confirmPassword
        ) {
            return res.render('auth/register-collector', {
                title: 'Register Collector - Bingo',
                error: 'Please fill all fields.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register-collector', {
                title: 'Register Collector - Bingo',
                error: 'Passwords do not match.'
            });
        }

        const existingCollector = await Collector.findOne({ email });

        if (existingCollector) {
            return res.render('auth/register-collector', {
                title: 'Register Collector - Bingo',
                error: 'Email already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const collector = new Collector({
            name,
            email,
            phone,
            location,
            address,
            password: hashedPassword
        });

        await collector.save();

        res.redirect('/auth/login');

    } catch (err) {

        console.error('Register Collector Error:', err);

        res.render('auth/register-collector', {
            title: 'Register Collector - Bingo',
            error: 'Server error.'
        });

    }

});

// =======================
// Logout
// =======================
router.get('/logout', (req, res) => {

    req.session.destroy(err => {

        if (err) {
            console.error(err);
            return res.redirect('/');
        }

        res.clearCookie('connect.sid');
        res.redirect('/');
    });

});

module.exports = router;