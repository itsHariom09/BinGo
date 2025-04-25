const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { ensureHead } = require('../middleware/auth');
const Member = require('../models/Member');
const Request = require('../models/Request');
const Collector = require('../models/Collector');

// Dashboard
router.get('/dashboard', ensureHead, async (req, res) => {
    try {
        const members = await Member.find({ society: req.session.user._id });
        const pendingRequests = await Request.find({ 
            society: req.session.user._id,
            status: 'pending'
        }).populate('member');
        
        res.render('head/dashboard', {
            user: req.session.user,
            members: members.length,
            pendingRequests: pendingRequests.length
        });
    } catch (err) {
        console.error(err);
        res.redirect('/head/dashboard');
    }
});

// Members
router.get('/members', ensureHead, async (req, res) => {
    try {
        const members = await Member.find({ society: req.session.user._id });
        res.render('head/members', {
            user: req.session.user,
            members
        });
    } catch (err) {
        console.error(err);
        res.redirect('/head/dashboard');
    }
});

// Add Member
router.post('/members', ensureHead, async (req, res) => {
    const { name, houseNo, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const member = new Member({
            name,
            houseNo,
            email,
            password: hashedPassword,
            society: req.session.user._id
        });

        await member.save();
        res.redirect('/head/members');
    } catch (err) {
        console.error(err);
        res.redirect('/head/members');
    }
});

// Requests
router.get('/requests', ensureHead, async (req, res) => {
    try {
        const requests = await Request.find({ society: req.session.user._id })
            .populate('member')
            .populate('collector');
            
        const collectors = await Collector.find({ area: req.session.user.city });
        
        res.render('head/requests', {
            user: req.session.user,
            requests,
            collectors
        });
    } catch (err) {
        console.error(err);
        res.redirect('/head/dashboard');
    }
});

// Assign Collector
router.post('/requests/assign', ensureHead, async (req, res) => {
    const { requestId, collectorId } = req.body;
    
    try {
        await Request.findByIdAndUpdate(requestId, {
            collector: collectorId,
            status: 'assigned'
        });
        
        res.redirect('/head/requests');
    } catch (err) {
        console.error(err);
        res.redirect('/head/requests');
    }
});

router.post('/members', ensureHead, async (req, res) => {
    const { name, houseNo, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const member = new Member({
            name,
            houseNo,
            email,
            password: hashedPassword,
            society: req.session.user._id
        });

        await member.save();
        res.redirect('/head/members');
    } catch (err) {
        console.error(err);
        res.redirect('/head/members');
    }
});
// In your head/requests route handler (routes/head.js)
router.get('/requests', ensureHead, async (req, res) => {
    try {
        const collectors = await Collector.find({ area: req.session.user.city });
        // Ensure you're passing collectors to the view
        res.render('head/requests', {
            collectors: collectors || [] // Fallback to empty array
        });
    } catch (err) {
        console.error(err);
        res.render('head/requests', {
            collectors: [], // Provide empty array on error
            error: 'Failed to load collectors'
        });
    }
});

module.exports = router;