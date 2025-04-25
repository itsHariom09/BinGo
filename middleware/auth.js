

// middleware/auth.js
module.exports = {
    ensureGuest: (req, res, next) => {
      if (!req.session.user) return next();
      const redirectPath = req.session.role === 'society' ? '/head/dashboard' :
                          req.session.role === 'member' ? '/member/dashboard' :
                          '/collector/dashboard';
      res.redirect(redirectPath);
    },
    
    ensureHead: (req, res, next) => {
      if (req.session.user && req.session.role === 'society') {
        return next();
      }
      res.redirect('/auth/login');
    },
    
    ensureMember: (req, res, next) => {
      if (req.session.user && req.session.role === 'member') {
        return next();
      }
      res.redirect('/auth/login');
    },
    
    ensureCollector: (req, res, next) => {
      if (req.session.user && req.session.role === 'collector') {
        return next();
      }
      res.redirect('/auth/login');
    }
  };