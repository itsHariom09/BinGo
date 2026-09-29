const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const { ensureHead } = require('../middleware/auth');
const Member = require('../models/Member');
const Request = require('../models/Request');
const Collector = require('../models/Collector');
const Society = require('../models/Society');

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
router.get('/requests', ensureHead, async (req, res) => {
    try {

        const [requests, collectors] = await Promise.all([

            // Society ke requests
            Request.find({
                society: req.session.user._id
            })
            .populate('member')
            .populate('collector')
            .sort({ requestedAt: -1 }),

            // ALL collectors - NO LOCATION FILTER
            Collector.find({})
                .select('name phone location address')
                .sort({ name: 1 })
        ]);

        console.log('Total Collectors:', collectors.length);
        console.log('Collectors:', collectors);

        res.render('head/requests', {
            title: 'Waste Requests',
            user: req.session.user,
            requests,
            collectors
        });

    } catch (err) {

        console.error('Requests Error:', err);

        res.status(500).render('head/requests', {
            title: 'Waste Requests',
            user: req.session.user,
            requests: [],
            collectors: [],
            error: 'Failed to load requests.'
        });
    }
});




// =======================
// Assign Collector
// =======================
router.post('/requests/assign', ensureHead, async (req, res) => {

    const { requestId, collectorId } = req.body;

    try {

        // 1. Check request
        const request = await Request.findOne({
            _id: requestId,
            society: req.session.user._id,
            status: 'pending'
        });

        if (!request) {
            console.log('Request not found:', requestId);
            return res.redirect('/head/requests');
        }

        // 2. Check collector
        const collector = await Collector.findById(collectorId);

        if (!collector) {
            console.log('Collector not found:', collectorId);
            return res.redirect('/head/requests');
        }

        // 3. Get society
        const society = await Society.findById(
            req.session.user._id
        );

        if (!society) {
            console.log('Society not found:', req.session.user._id);
            return res.redirect('/head/requests');
        }

        // 4. Make sure request has location and address
        const location = request.location || society.city || 'Not specified';

        const address = request.address || society.address || 'Not specified';

        // 5. Assign collector
        request.collector = collector._id;
        request.status = 'assigned';

        // Fix old requests
        request.location = location;
        request.address = address;

        await request.save();

        console.log('================================');
        console.log('Collector Assigned Successfully');
        console.log('Request:', request._id);
        console.log('Collector:', collector.name);
        console.log('Location:', request.location);
        console.log('Address:', request.address);
        console.log('================================');

        res.redirect('/head/requests');

    } catch (err) {

        console.error('Assign Collector Error:', err);

        res.redirect('/head/requests');
    }
});


module.exports = router;