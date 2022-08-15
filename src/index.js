const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const connectToDatabase = require('./database');
const routes = require('./routes');
const app = express();
const port = process.env.PORT || 3000;

async function startServer() {
    await connectToDatabase();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);
    
    if (process.env.PRODUCTION == 1) {
        console.log('Running on Cloud')
        var key = fs.readFileSync('/etc/nginx/ssl/thinkfast.key');
        var cert = fs.readFileSync('/etc/nginx/ssl/de681c0c19fba18b.crt');
        var options = {
            key: key,
            cert: cert
        };
        var server = https.createServer(options, app);
        server.listen(port, () => {
            console.log(`Server listining at https://thinkfast.in:${port}`);
        })
    } else {
        console.log('Running on local')
        app.listen(port, () => {
            console.log(`Server listining at http://localhost:${port}`);
        })
    }
}

module.exports = startServer;