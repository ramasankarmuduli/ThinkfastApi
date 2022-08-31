const models = require('../models');
const mongoose = require('mongoose');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

async function checkExistingCustomer(req, res) {
    var reqBody = req.body;
    const CommonModel = mongoose.model(reqBody.collection, models.Common);
    var mobile = reqBody.mobile

    CommonModel.find({ mobile: mobile }).exec(function (error, response) {
        if (error) {
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
            res.json(result);
        } else {
            console.log('response', response)
            var result;
            if(response.length > 0 ) {
                result = {
                    status: 'success',
                    isNewCustomer: false,
                    data: response[0]
                };
            } else {
                result = {
                    status: 'success',
                    isNewCustomer: true,
                    data: {}
                };
            }
            
            res.json(result);
        }
    });
}

module.exports = {
    checkExistingCustomer
}