const express = require('express');
const router = express.Router();
const { ensureMember } = require('../middleware/auth');
const Request = require('../models/Request');

// Dashboard
router.get('/dashboard', ensureMember, async (req, res) => {
    try {
        const requests = await Request.find({ member: req.session.user._id })
            .sort({ requestedAt: -1 })
            .limit(5);
            
        res.render('member/dashboard', {
            user: req.session.user,
            requests
        });
    } catch (err) {
        console.error(err);
        res.redirect('/member/dashboard');
    }
});

// Create Request
router.post('/request', ensureMember, async (req, res) => {
    try {
        const request = new Request({
            member: req.session.user._id,
            society: req.session.user.society,
            houseNo: req.session.user.houseNo
        });

        await request.save();
        res.redirect('/member/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/member/dashboard');
    }
});

module.exports = router;