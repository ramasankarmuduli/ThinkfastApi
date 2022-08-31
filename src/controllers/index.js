const auth = require('./auth.controller');
const common = require('./common.controller');
const sla = require('./sla.controller');
const store = require('./store.controller');

module.exports = {
    auth,
    common,
    sla,
    store
}