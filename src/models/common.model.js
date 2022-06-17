const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const offerSchema = new Schema( {any: {} }, { strict: false } );

module.exports = offerSchema; 