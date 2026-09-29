const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { ensureHead } = require('../middleware/auth');
const Member = require('../models/Member');
const Request = require('../models/Request');
const Collector = require('../models/Collector');

// =======================
// Dashboard
// =======================
router.get('/dashboard', ensureHead, async (req, res) => {
    try {
        const [members, pendingRequests] = await Promise.all([
            Member.countDocuments({
                society: req.session.user._id
            }),

            Request.countDocuments({
                society: req.session.user._id,
                status: 'pending'
            })
        ]);

        res.render('head/dashboard', {
            title: 'Society Dashboard',
            user: req.session.user,
            members,
            pendingRequests
        });

    } catch (err) {

        console.error('Dashboard Error:', err);

        res.status(500).render('head/dashboard', {
            title: 'Society Dashboard',
            user: req.session.user,
            members: 0,
            pendingRequests: 0,
            error: 'Failed to load dashboard.'
        });

    }
});

// =======================
// Members List
// =======================
router.get('/members', ensureHead, async (req, res) => {

    try {

        const members = await Member.find({
            society: req.session.user._id
        });

        res.render('head/members', {
            title: 'Members',
            user: req.session.user,
            members
        });

    } catch (err) {

        console.error('Members Error:', err);

        res.status(500).render('head/members', {
            title: 'Members',
            user: req.session.user,
            members: [],
            error: 'Failed to load members.'
        });

    }

});

// =======================
// Add Member
// =======================
router.post('/members', ensureHead, async (req, res) => {

    const {
        name,
        houseNo,
        email,
        password
    } = req.body;

    try {

        if (!name || !houseNo || !email || !password) {
            return res.redirect('/head/members');
        }

        const existingMember = await Member.findOne({ email });

        if (existingMember) {
            return res.redirect('/head/members');
        }

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

        console.error('Add Member Error:', err);

        res.redirect('/head/members');

    }

});

// =======================
// Requests
// =======================
router.post('/request', ensureMember, async (req, res) => {
    try {

        console.log('\n========== CREATE REQUEST ==========');

        console.log('SESSION USER:', req.session.user);
        console.log('USER ID:', req.session.user?._id);
        console.log('SOCIETY ID:', req.session.user?.society);
        console.log('HOUSE NO:', req.session.user?.houseNo);

        // ==========================
        // 1. Check existing request
        // ==========================
        const existingRequest = await Request.findOne({
            member: req.session.user._id,
            status: { $in: ['pending', 'assigned'] }
        });

        if (existingRequest) {
            console.log('Already existing request:', existingRequest._id);
            return res.redirect('/member/dashboard');
        }

        // ==========================
        // 2. Validate member data
        // ==========================
        if (!req.session.user.society) {
            console.log('ERROR: Society ID missing');
            return res.status(400).send('Society information missing from member session.');
        }

        if (!req.session.user.houseNo) {
            console.log('ERROR: House number missing');
            return res.status(400).send('House number missing from member session.');
        }

        // ==========================
        // 3. Find society
        // ==========================
        const society = await Society.findById(
            req.session.user.society
        );

        console.log('FOUND SOCIETY:', society);

        if (!society) {
            return res.status(404).send('Society not found.');
        }

        // ==========================
        // 4. Create request
        // ==========================
        const request = new Request({

            member: req.session.user._id,

            society: society._id,

            houseNo: req.session.user.houseNo,

            location: `${society.address}, ${society.city}`,

            status: 'pending',

            requestedAt: new Date()
        });

        console.log('REQUEST BEFORE SAVE:', request);

        // ==========================
        // 5. Save
        // ==========================
        await request.save();

        console.log('SUCCESS! REQUEST CREATED:', request._id);

        res.redirect('/member/dashboard');

    } catch (err) {

        console.error('\n========== CREATE REQUEST ERROR ==========');
        console.error(err);
        console.error('MESSAGE:', err.message);
        console.error('ERRORS:', err.errors);

        res.status(500).send(`
            <h2>Request Creation Failed</h2>
            <pre>${err.stack}</pre>
            <br>
            <a href="/member/dashboard">Go Back</a>
        `);
    }
});

// =======================
// Assign Collector
// =======================
router.post('/requests/assign', ensureHead, async (req, res) => {

    const { requestId, collectorId } = req.body;

    try {

        const request = await Request.findOne({
            _id: requestId,
            society: req.session.user._id
        });

        if (!request) {
            return res.redirect('/head/requests');
        }

        request.collector = collectorId;
        request.status = 'assigned';

        await request.save();

        res.redirect('/head/requests');

    } catch (err) {

        console.error('Assign Collector Error:', err);

        res.redirect('/head/requests');

    }

});

module.exports = router;