const models = require('../models');
const mongoose = require('mongoose');

async function saveDoc(req, res) {
    const CommonModel = mongoose.model(req.body.collection, models.Common);
    const commonDoc = new CommonModel(JSON.parse(JSON.stringify(req.body.data)));
    commonDoc.save(function (error, response) {
        if(error) {
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

async function fetchDoc(req, res) {
    let collection = req.query.collection;
    //let limit = req.query.limit;
    const CommonModel = mongoose.model(collection, models.Common);
    CommonModel.find({}, function (error, response) {
        if (error){
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
        } else{
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
        if (error){
            console.log(error);
            let result = {
                status: 'failed',
                message: '',
            }
        } else{
            let result = {
                status: 'success',
                message: '',
                data: response
            };
            res.json(result);
        }
    });
}

module.exports = {
    saveDoc,
    fetchDoc,
    fetchDocById
}