const models = require('../models');
const User = models.User;
const Session = models.Session;

const SecurityUtil = require('../utils').SecuritryUtils;

class AuthController {

    /**
     *
     * @param login
     * @param password
     * @param email
     * @param isAdmin
     * @param isPreparator
     * @return {Promise<User>}
     */
    static async subscribe(login, password, email,isAdmin,isPreparator) {
        //check if user with this email already exists
        const emails = await User.findOne({email});
        if(emails)
            return null;

        //check if user with this login already exists
        const logins = await User.findOne({login});
        if(logins)
            return null;

        const user = new User({
            login: login,
            password: SecurityUtil.hashPassword(password),
            email: email,
            isAdmin: isAdmin,
            isPreparator: isPreparator
        });
        await user.save();
        return user;
    }

     static async login(login, password) {
        const user = await User.findOne({
            login: login,
            password: SecurityUtil.hashPassword(password)
        });
        if (!user) {
            return null;
        }
        const session = new Session({
            token: await SecurityUtil.randomToken(),
            isValid: true
        });
        session.uid = user.id;
        await session.save();
        return session;
    }

    static async getUserById(id) {
        const user = await User.findOne({_id: session.uid});
        return user;
    }

    static async userFromToken(token) {
        const session = await Session.findOne({token: token, isValid: true});
        if(!session){
            return null;
        }
        const user = await User.findOne({_id: session.uid});
        return user;
    }

    static async adminFromToken(token) {
        const session = await Session.findOne({token: token, isValid: true});
        if(!session){
            return null;
        }
        const admin = await User.findOne({_id: session.uid, isAdmin: true});
        return admin;
    }

    static async logout(token) {
        const res = await Session.updateOne({ token: token},{ isValid: false}, (err) => {
            if(err){
                return false;
            }
        });
        if(res.n == 0){
            return false;
        }
        return true;
    }
}

module.exports = AuthController;
