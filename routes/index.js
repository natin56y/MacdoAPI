module.exports = function (app) {
    require('./auth.route')(app);
    require('./project.route')(app);
    require('./user.route')(app);
    require('./command.route')(app);
    require('./admin')(app);
};
