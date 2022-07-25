const ensureAuthorized = (req, res, next) => {
    if (req.isAuthenticated() && req.user.status == 1) {
        return next();
    }
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
}
module.exports = ensureAuthorized;