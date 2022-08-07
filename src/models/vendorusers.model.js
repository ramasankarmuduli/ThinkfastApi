const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const vendorUserSchema = new Schema({
    vendorName: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    password: { type: String }
});

const Vendorusers = model('Vendorusers', vendorUserSchema);

module.exports = Vendorusers; 