const bodyParser = require('body-parser');
const AuthMiddleware = require('../middleware').AuthMiddleware;

module.exports = function (app) {
    app.get('/user/userFromToken', AuthMiddleware.auth(), bodyParser.json(), (req, res) => {
        res.status(200).json(req.user);
    });
}
