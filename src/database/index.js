const mongoose = require('mongoose');
//mongoose.Promise = global.Promise;

async function connectToDatabase() {
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS;
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;

    const connectionString = `mongodb://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;

    await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log('connected to database');
    });
}

module.exports = connectToDatabase;