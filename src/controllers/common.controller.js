const models = require('../models');
const mongoose = require('mongoose');

async function saveDoc(req, res) {
    const CommonModel = mongoose.model(req.body.collection, models.Common);
    if (req.body.meta && req.body.meta.multiInsert) {
        var insertData = JSON.parse(JSON.stringify(req.body.data));
        CommonModel.insertMany(insertData)
            .then(function (response) {
                let result = {
                    status: 'success',
                    message: '',
                    data: response
                };
                res.json(result);
            }).catch(function (error) {
                let result = {
                    status: 'failed',
                    message: '',
                }
                res.json(result);
            });
    } else {
        const commonDoc = new CommonModel(JSON.parse(JSON.stringify(req.body.data)));
        commonDoc.save(function (error, response) {
            if (error) {
                let result = {
                    status: 'failed',
                    message: '',
                }
                res.json(result);
            } else {
                let result = {
                    status: 'success',
                    message: '',
                    data: response
                };
                res.json(result);
            }
        });
    }

}

async function fetchDoc(req, res) {
    let collection = req.query.collection;
    //let limit = req.query.limit;
    const CommonModel = mongoose.model(collection, models.Common);
    CommonModel.find({}, function (error, response) {
        if (error) {
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
        } else {
            let result = {
                status: 'success',
                message: '',
                data: response
            };
            res.json(result);
        }
    });
}

async function fetchDocById(req, res) {
    let collection = req.query.collection;
    let id = req.params.id;
    const CommonModel = mongoose.model(collection, models.Common);
    CommonModel.findById(id, function (error, response) {
        if (error) {
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
        } else {
            let result = {
                status: 'success',
                message: '',
                data: response
            };
            res.json(result);
        }
    });
}

async function updateDoc(req, res) {
    const CommonModel = mongoose.model(req.body.collection, models.Common);
    var docId = req.body.id;
    var docData = JSON.parse(JSON.stringify(req.body.data));
    var options = { 'upsert': false, returnOriginal: false };
    CommonModel.findByIdAndUpdate(docId, docData, options, function (error, response) {
        console.log('response', response)
        if (error) {
            let result = {
                status: 'failed',
                message: '',
            }
            res.json(result);
        } else {
            let result = {
                status: 'success',
                message: '',
                data: response
            };
            res.json(result);
        }
    });
}

async function deleteDocById(req, res) {
    let collection = req.query.collection;
    let id = req.params.id;
    const CommonModel = mongoose.model(collection, models.Common);
    CommonModel.findByIdAndRemove(id, function (error, response) {
        if (error) {
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
        } else {
            let result = {
                status: 'success',
                message: 'Deleted Successfully'
            };
            res.json(result);
        }
    });
}

module.exports = {
    saveDoc,
    fetchDoc,
    fetchDocById,
    updateDoc,
    deleteDocById
}