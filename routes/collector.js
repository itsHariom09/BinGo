const express = require('express');
const router = express.Router();

const { ensureCollector } = require('../middleware/auth');
const Request = require('../models/Request');

// =======================
// Collector Dashboard
// =======================
router.get('/dashboard', ensureCollector, async (req, res) => {
    try {
        const collectorId = req.session.user._id;

        // Today's date (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingRequests, completedToday, totalCompleted] =
            await Promise.all([
                Request.find({
                    collector: collectorId,
                    status: 'assigned'
                })
                .populate('member')
                .populate('society'),

                Request.countDocuments({
                    collector: collectorId,
                    status: 'completed',
                    completedAt: { $gte: today }
                }),

                Request.countDocuments({
                    collector: collectorId,
                    status: 'completed'
                })
            ]);

        res.render('collector/dashboard', {
            title: 'Collector Dashboard',
            user: req.session.user,
            pendingRequests,
            completedToday,
            totalCompleted
        });

    } catch (err) {

        console.error('Collector Dashboard Error:', err);

        res.status(500).render('collector/dashboard', {
            title: 'Collector Dashboard',
            user: req.session.user,
            pendingRequests: [],
            completedToday: 0,
            totalCompleted: 0,
            error: 'Failed to load dashboard.'
        });

    }
});

// =======================
// Complete Request
// =======================
router.post('/complete/:id', ensureCollector, async (req, res) => {

    try {

        const request = await Request.findOne({
            _id: req.params.id,
            collector: req.session.user._id,
            status: 'assigned'
        });

        if (!request) {
            return res.redirect('/collector/dashboard');
        }

        request.status = 'completed';
        request.completedAt = new Date();

        await request.save();

        res.redirect('/collector/dashboard');

    } catch (err) {

        console.error('Complete Request Error:', err);

        res.redirect('/collector/dashboard');

    }

});

module.exports = router;