const models = require('../models');
const mongoose = require('mongoose');

async function getStoreapiDetails(vendorId) {
    //try {
        let storeapiCollection = "storeapi_" + vendorId;
        const StoreapiModel = mongoose.model(storeapiCollection, models.Common);
        const storeapiDetails = await StoreapiModel.find();
        return storeapiDetails;
    // } catch (error) {
    //     console.log('error', error.message)
    // }
}

module.exports = {
    getStoreapiDetails
}