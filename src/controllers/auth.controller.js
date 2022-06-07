const models = require('../models');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

async function signup(req, res) {
    const userDoc = models.User({
        username: req.body.username,
        password: await argon2.hash(req.body.password)
    });
    await userDoc.save((error, response) => {
        if (error) {
            let result = {
                status: 'failed',
                message: '',
            }
            console.log('error', error);
            res.json(result);
        } else {
            console.log("succesfull inserted : ", response);
            const accessToken = createToken(response.id, response.username);
            let result = {
                status: 'success',
                message: '',
                data: {
                    userId: response.id,
                    username: response.username,
                    accessToken: accessToken
                }
            };
            res.json(result);
        }
    });
}

async function login(req, res) {
    const userDoc = await models.User
                                .findOne({ username: req.body.username })
                                .select('password')
                                .exec();
    
    if (await argon2.verify(userDoc.password, req.body.password)) {
        const accessToken = createToken(userDoc.id, req.body.username);
        res.json({
            status: 'success',
            message: '',
            data: {
                userId: userDoc.id,
                username: req.body.username,
                accessToken: accessToken
            }
        });
    }
}

function createToken(userId, userName) {
    return jwt.sign({
        userId: userId,
        userName: userName
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '30m'
    })
}

module.exports = {
    signup,
    login
}