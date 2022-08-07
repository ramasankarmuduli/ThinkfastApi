const models = require('../models');
const mongoose = require('mongoose');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

async function saveDoc(req, res) {
    var reqBody = req.body;
    const CommonModel = mongoose.model(reqBody.collection, models.Common);
    if (reqBody.meta && reqBody.meta.multiInsert) {
        var insertData = JSON.parse(JSON.stringify(reqBody.data));
        if (reqBody.meta) {
            if (reqBody.meta.isPassword) {
                let passwordKey = reqBody.meta.passwordKey;
                insertData.forEach(iData => {
                    iData[passwordKey] = argon2.hash(iData[passwordKey]);
                });
            }
        }
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
        var insertData = JSON.parse(JSON.stringify(reqBody.data));
        var isDuplicateRecord;
        if (reqBody.meta) {
            if (reqBody.meta.duplicate && reqBody.meta.duplicate.length > 0) {
                var metchingObj = {};
                reqBody.meta.duplicate.forEach(duplicateKey => {
                    metchingObj[duplicateKey] = insertData[duplicateKey];
                })
                isDuplicateRecord = await CommonModel
                    .count(metchingObj)
                    .exec();
            }
            if (reqBody.meta.isPassword) {
                let passwordKey = reqBody.meta.passwordKey;
                insertData[passwordKey] = await argon2.hash(insertData[passwordKey]);
            }
        }
        if (isDuplicateRecord > 0) {
            let result = {
                status: 'failed',
                message: 'UNIQUE KEY CONSTRAINT',
            }
            res.json(result);
        } else {
            const commonDoc = new CommonModel(insertData);
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
}

async function fetchDoc(req, res) {
    console.log('req.query', req.query);
    let collection = req.query.collection;
    let isSort = (req.query.isSort) ? req.query.isSort : false;
    let sortKeyName = (req.query.sortKeyName) ? req.query.sortKeyName : "";
    let orderType = (req.query.orderType) ? req.query.orderType : 1;

    //let sortKey = sortDetails[0].keyName;
    //let orderType = (sortDetails[0].orderType != 'asc') ? -1 : 1 ;
    var sortQuery = { [sortKeyName]: orderType };
    //console.log('sortDetails', sortDetails[0]);
    //console.log('sortKey', sortKeyName);
    //console.log('sortQuery', sortQuery);
    //let limit = req.query.limit;
    const CommonModel = mongoose.model(collection, models.Common);
    if (!isSort) {
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
    } else {
        CommonModel.find({}).sort(sortQuery).exec(function (error, response) {
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
    var reqBody = req.body;
    var insertData = JSON.parse(JSON.stringify(reqBody.data));
    var isDuplicateRecord;
    if (reqBody.meta) {
        if (reqBody.meta.duplicate && reqBody.meta.duplicate.length > 0) {
            var metchingObj = {};
            reqBody.meta.duplicate.forEach(duplicateKey => {
                metchingObj[duplicateKey] = insertData[duplicateKey];
            })
            isDuplicateRecord = await CommonModel
                .count(metchingObj)
                .exec();
        }
        if (reqBody.meta.isPassword) {
            let passwordKey = reqBody.meta.passwordKey;
            insertData[passwordKey] = await argon2.hash(insertData[passwordKey]);
        }
    }
    if (isDuplicateRecord > 0) {
        let result = {
            status: 'failed',
            message: 'UNIQUE KEY CONSTRAINT',
        }
        res.json(result);
    } else {
        
        var docId = reqBody.id;
        var docData = JSON.parse(JSON.stringify(reqBody.data));
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