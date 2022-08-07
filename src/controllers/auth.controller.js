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
    try {
        const userDoc = await models.vendorUser.findOne({ email: req.body.username });
        if (await argon2.verify(userDoc.password, req.body.password)) {
            const accessToken = createToken(userDoc.id, req.body.username);
            let resData = {
                storeId: userDoc.id,
                storename: userDoc.storename,
                username: userDoc.email,
                phone: userDoc.phone,
                accessToken: accessToken
            };

            res.json({
                status: 'success',
                message: '',
                data: resData
            });
        }
    } catch (error) {
        res.json({
            status: 'fail',
            message: ''
        });
    }
}

async function superAdminSignup(req, res) {
    const userDoc = models.SuperAdminUser({
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

async function superAdminLogin(req, res) {
    try {
        const userDoc = await models.SuperAdminUser
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
    } catch (error) {
        res.json({
            status: 'fail',
            message: ''
        });
    }
}











function createToken(userId, userName) {
    return jwt.sign({
        userId: userId,
        userName: userName
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '24h'
    })
}

const validateToken = async (token) => {
    const decodeToken = () => {
        try {
            return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        } catch (error) {
            return error;
        }
    }

    const decodedToken = decodeToken();
    const tokenExists = await models.User.exists({ _id: decodedToken.id, username: decodedToken.username });

    if (tokenExists) {
        return decodedToken;
    } else {
        return "Unauthorised";
    }
}

module.exports = {
    signup,
    login,
    superAdminSignup,
    superAdminLogin
}