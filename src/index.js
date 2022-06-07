const express = require('express'); 
const connectToDatabase = require('./database');
const routes = require('./routes');
const app = express();
const port = process.env.PORT || 3000;
async function startServer() {
    await connectToDatabase();
    app.use(express.json());

    app.use('/api', routes);

    app.listen(port, () => {
        console.log(`Server listining at http://localhost:${port}`);
    })
}

module.exports = startServer;