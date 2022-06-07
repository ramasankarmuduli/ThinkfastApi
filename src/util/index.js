function errorHandler(fn) {
    return async function(req, res, next) {
        try{
            const result = await fn(req, res);
            console.log('util-result', result);
            res.json(result);
        } catch(e) {
            next(e);
        }
    }
}

module.exports = {
    errorHandler
}