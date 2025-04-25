const express = require('express');
const router = express.Router();
const { ensureCollector } = require('../middleware/auth');
const Request = require('../models/Request');

// // Dashboard
// router.get('/dashboard', ensureCollector, async (req, res) => {
//     try {
//         const pendingRequests = await Request.find({
//             collector: req.session.user._id,
//             status: 'assigned'
//         }).populate('member');
        
//         res.render('collector/dashboard', {
//             user: req.session.user,
//             pendingRequests
//         });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/collector/dashboard');
//     }
// });

// // Complete Request
// router.post('/complete/:id', ensureCollector, async (req, res) => {
//     try {
//         await Request.findByIdAndUpdate(req.params.id, {
//             status: 'completed',
//             completedAt: Date.now()
//         });
        
//         res.redirect('/collector/dashboard');
//     } catch (err) {
//         console.error(err);
//         res.redirect('/collector/dashboard');
//     }
// });

// router.get('/dashboard', ensureCollector, async (req, res) => {
//     try {
//         // Get current date at midnight
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         // Get pending requests with society info
//         const pendingRequests = await Request.find({
//             collector: req.session.user._id,
//             status: 'assigned'
//         }).populate('society');

//         // Get completion stats
//         const [completedToday, totalCompleted] = await Promise.all([
//             Request.countDocuments({
//                 collector: req.session.user._id,
//                 status: 'completed',
//                 completedAt: { $gte: today }
//             }),
//             Request.countDocuments({
//                 collector: req.session.user._id,
//                 status: 'completed'
//             })
//         ]);

//         res.render('collector/dashboard', {
//             title: 'Collector Dashboard',
//             user: req.session.user,
//             pendingRequests,
//             completedToday: completedToday || 0,  // Ensure it's never undefined
//             totalCompleted: totalCompleted || 0   // Ensure it's never undefined
//         });
//     } catch (err) {
//         console.error(err);
//         res.redirect('/collector/dashboard');
//     }
// });




router.get('/dashboard', ensureCollector, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [pendingRequests, completedToday, totalCompleted] = await Promise.all([
            Request.find({ collector: req.session.user._id, status: 'assigned' }).populate('society'),
            Request.countDocuments({ 
                collector: req.session.user._id,
                status: 'completed',
                completedAt: { $gte: today }
            }),
            Request.countDocuments({ 
                collector: req.session.user._id,
                status: 'completed' 
            })
        ]);

        res.render('collector/dashboard', {
            title: 'Collector Dashboard',
            user: req.session.user,
            pendingRequests: pendingRequests || [],
            completedToday: completedToday || 0,
            totalCompleted: totalCompleted || 0
        });

    } catch (err) {
        console.error('Dashboard error:', err);
        res.render('collector/dashboard', {
            title: 'Collector Dashboard',
            user: req.session.user,
            pendingRequests: [],
            completedToday: 0,
            totalCompleted: 0,
            error: 'Failed to load dashboard data'
        });
    }
});

module.exports = router;