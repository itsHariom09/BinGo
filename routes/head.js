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

            Request.find({
                society: req.session.user._id
            })
            .populate('member')
            .populate('collector')
            .sort({ requestedAt: -1 }),

            Collector.find({})
                .select('name phone location address')
        ]);

        console.log('Society ID:', req.session.user._id);
        console.log('Society City:', req.session.user.city);
        console.log('Collectors Count:', collectors.length);
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




// router.get('/requests', ensureHead, async (req, res) => {

//     try {

//         const [requests, collectors] = await Promise.all([

//             Request.find({
//                 society: req.session.user._id
//             })
//             .populate('member')
//             .populate('collector')
//             .sort({ requestedAt: -1 }),

//             // TEMPORARY: all collectors
//             Collector.find({})
//                 .select('name phone location address')

//         ]);

//         console.log('Society City:', req.session.user.city);
//         console.log('Collectors:', collectors);

//         res.render('head/requests', {
//             title: 'Waste Requests',
//             user: req.session.user,
//             requests,
//             collectors
//         });

//     } catch (err) {

//         console.error('Requests Error:', err);

//         res.status(500).render('head/requests', {
//             title: 'Waste Requests',
//             user: req.session.user,
//             requests: [],
//             collectors: [],
//             error: 'Failed to load requests.'
//         });

//     }

// });

// =======================
// Assign Collector
// =======================
router.post('/requests/assign', ensureHead, async (req, res) => {

    const { requestId, collectorId } = req.body;

    try {

        const request = await Request.findOne({
            _id: requestId,
            society: req.session.user._id,
            status: 'pending'
        });

        if (!request) {
            console.log('Request not found:', requestId);
            return res.redirect('/head/requests');
        }

        const collector = await Collector.findById(collectorId);

        if (!collector) {
            console.log('Collector not found:', collectorId);
            return res.redirect('/head/requests');
        }

        // Location check only if both locations exist
        if (request.location && collector.location) {

            const requestLocation = request.location
                .trim()
                .toLowerCase();

            const collectorLocation = collector.location
                .trim()
                .toLowerCase();

            if (!collectorLocation.includes(requestLocation)) {

                console.log('Location mismatch');
                console.log('Request:', requestLocation);
                console.log('Collector:', collectorLocation);

                return res.redirect('/head/requests');
            }
        }

        request.collector = collector._id;
        request.status = 'assigned';

        await request.save();

        console.log(
            `Collector ${collector.name} assigned to request ${request._id}`
        );

        res.redirect('/head/requests');

    } catch (err) {

        console.error('Assign Collector Error:', err);

        res.redirect('/head/requests');
    }
});

module.exports = router;