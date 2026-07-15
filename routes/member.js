const express = require('express');
const router = express.Router();

const { ensureMember } = require('../middleware/auth');
const Request = require('../models/Request');

// =======================
// Member Dashboard
// =======================
router.get('/dashboard', ensureMember, async (req, res) => {
    try {

        const requests = await Request.find({
            member: req.session.user._id
        })
        .sort({ requestedAt: -1 })
        .limit(5);

        res.render('member/dashboard', {
            title: 'Member Dashboard',
            user: req.session.user,
            requests
        });

    } catch (err) {

        console.error('Member Dashboard Error:', err);

        res.status(500).render('member/dashboard', {
            title: 'Member Dashboard',
            user: req.session.user,
            requests: [],
            error: 'Failed to load dashboard.'
        });

    }
});

// =======================
// Create Waste Request
// =======================
router.post('/request', ensureMember, async (req, res) => {

    try {

        // Check if member already has a pending request
        const existingRequest = await Request.findOne({
            member: req.session.user._id,
            status: { $in: ['pending', 'assigned'] }
        });

        if (existingRequest) {
            return res.redirect('/member/dashboard');
        }

        const request = new Request({
            member: req.session.user._id,
            society: req.session.user.society,
            houseNo: req.session.user.houseNo,
            status: 'pending',
            requestedAt: new Date()
        });

        await request.save();

        res.redirect('/member/dashboard');

    } catch (err) {

        console.error('Create Request Error:', err);

        res.redirect('/member/dashboard');

    }

});

module.exports = router;