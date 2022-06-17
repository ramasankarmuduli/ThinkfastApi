const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const superAdminUserSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String, select: false }
});

const SuperAdminUser = model('SuperAdminUser', superAdminUserSchema);

module.exports = SuperAdminUser; 