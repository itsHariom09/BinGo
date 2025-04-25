module.exports = (req, res, next) => {
    // Make user data available to all views
    res.locals.user = req.session.user;
    res.locals.role = req.session.role;
    next();
  };