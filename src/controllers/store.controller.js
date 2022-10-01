const models = require('../models');
const mongoose = require('mongoose');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const axios = require('axios').default;

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
            if (response.length > 0) {
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

async function sinkWirehouse(req, res) {
    try {
        let vendorId = req.body.vendorId;
        //let collection = req.body.collection;
        if (vendorId) {
            let storeapiCollection = "storeapi_" + vendorId;
            const StoreapiModel = mongoose.model(storeapiCollection, models.Common);
            const storeapiDetails = await StoreapiModel.find();
            console.log("storeapiDetails", storeapiDetails);

            let shopifyStoreUrl = storeapiDetails[0].shopifyStoreUrl;
            let shopifyApiAccessToken = storeapiDetails[0].shopifyApiAccessToken;
            let shopifyApiKey = storeapiDetails[0].shopifyApiKey;
            let shopifyApiSecretKey = storeapiDetails[0].shopifyApiSecretKey;
            let shopifyApiVersion = (storeapiDetails[0].shopifyApiVersion) ? storeapiDetails[0].shopifyApiVersion : "2022-07";

            let locationApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/locations.json";
            const locationResponse = await axios.get(locationApiUrl, {
                headers: {
                    "X-Shopify-Access-Token": shopifyApiAccessToken
                }
            });
            if (locationResponse.status == 200) {
                let wirehouseCollection = "wirehouses_" + vendorId;
                const WirehouseModel = mongoose.model(wirehouseCollection, models.Common);
                const wirehouseDetails = await WirehouseModel.find();
                console.log("wirehouseDetails", wirehouseDetails);

                let locationsDetails = locationResponse.data.locations;
                console.log('locationsDetails', locationsDetails)
                let insertData = [];

                for (let index = 0; index < locationsDetails.length; index++) {
                    const location = locationsDetails[index];
                    if (!wirehouseDetails.some(wh => wh.locationName === location.name)) {
                        insertData.push({
                            "shopifyLocationId": location.id,
                            "locationName": location.name,
                            "phone": location.phone,
                            "address1": location.address1,
                            "address2": location.address2,
                            "countryRegion": location.country_name,
                            "state": location.province,
                            "city": location.city,
                            "pincode": location.zip,
                            "pickupTimeStart": "10:00",
                            "pickupTimeEnd": "16:00",
                        })
                    }
                }

                if (insertData.length > 0) {
                    WirehouseModel.insertMany(insertData)
                        .then(function (response) {
                            let result = {
                                status: 'success',
                                message: '',
                                data: response
                            };
                            res.json(result);
                        }).catch(function (error) {
                            let result = {
                                status: 'false',
                                message: 'Failed to sink wirehouse. Tyr again',
                            }
                            res.json(result);
                        });
                } else {
                    throw new Error("No wirehouse found to sink.");
                }
            }
        } else {
            throw new Error("Invalid Store.");
        }
    } catch (error) {
        console.error(error);
        let result = {
            status: 'false',
            message: error.message
        };
        res.json(result);
    }
}

module.exports = {
    checkExistingCustomer,
    sinkWirehouse
}