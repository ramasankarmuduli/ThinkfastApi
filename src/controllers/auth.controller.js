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
            console.log('12121')
            const accessToken = createToken(userDoc.id, req.body.username);
            let resData = {
                storeId: userDoc.id,
                vendorName: userDoc.vendorName,
                username: userDoc.email,
                phone: userDoc.phone,
                accessToken: accessToken
            };

            res.json({
                status: 'success',
                message: '',
                data: resData
            });
        } else {
            throw new Error("Invalid Password");
        }
    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
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

async function validateJwtToken(req, res) {
    try {
        let reqToken = req.body.token;
        if(reqToken) {
            var validateToken = validToken(reqToken);
            if(validateToken.status) {
                res.json({
                    status: 'success'
                });
            } else {
                throw new Error(validateToken.message);
            }
        } else {
            throw new Error("TOKEN NOT FOUND");
        }
    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
        });
    }
}
function validToken(token) {
    try {
        if(jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)) {
            return {
                status: true
            }
        } else {
            return {
                status: false,
                message: ""
            }
        }
    } catch (error) {        
        return {
            status: false,
            message: error.message
        }
    }
}

function createToken(userId, userName) {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 10800 // seconds
    return jwt.sign({
        userId: userId,
        userName: userName,
        iat,
        exp
    }, process.env.ACCESS_TOKEN_SECRET)
}

module.exports = {
    signup,
    login,
    superAdminSignup,
    superAdminLogin,
    validateJwtToken
}