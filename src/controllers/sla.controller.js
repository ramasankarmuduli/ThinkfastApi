const models = require('../models');
const mongoose = require('mongoose');
const axios = require('axios').default;
var FormData = require('form-data');
const moment = require('moment');
const xml2js = require('xml2js');

async function checkPin(req, res) {
    try {
        let pincode = req.body.pincode;
        let productId = req.body.productId;
        let selectedOptions = req.body.selectedOptions;
        let vendorId = req.body.vendorId;
        let selectedOptionValues = (selectedOptions) ? selectedOptions.map(function (d) { return d["value"]; }) : [];

        let pincodeCollection = "pincodes";
        const PincodeModel = mongoose.model(pincodeCollection, models.Common);
        const pincodeDetails = await PincodeModel.find({ Pincode: parseInt(pincode) });
        if (pincodeDetails.length > 0) {
            let wirehouseCollection = "wirehouses_" + vendorId;
            const WirehouseModel = mongoose.model(wirehouseCollection, models.Common);
            const wirehouseDetails = await WirehouseModel.find();
            console.log("wirehouseDetails", wirehouseDetails);

            let courierCollection = "couriorsetup_" + vendorId;
            const CourierModel = mongoose.model(courierCollection, models.Common);
            const courierDetails = await CourierModel.find();
            console.log("courierDetails", courierDetails);

            let delhiveryToken = "";
            let pickrrToken = "";
            var shipRocketToken = "";

            var courierType = [
                {
                    type: "delhivery",
                    url: "https://track.delhivery.com/c/api/pin-codes/json/",
                    token: delhiveryToken,
                    status: "Active"
                },
                {
                    type: "ecomExpress",
                    url: "https://clbeta.ecomexpress.in/apiv2/pincodes/",
                    username: "cafe24indiapl541322",
                    password: "ijatgfrsikjsghsg",
                    status: "NotActive"
                },
                {
                    type: "pickrr",
                    url: "https://www.pickrr.com/api/check-pincode-service/",
                    auth_token: pickrrToken,
                    status: "Active"
                },
                {
                    type: "shiprocket",
                    url: "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
                    token: shipRocketToken, //"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjI4NjcyNTYsImlzcyI6Imh0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9hdXRoL2xvZ2luIiwiaWF0IjoxNjU5MTk4NTE4LCJleHAiOjE2NjAwNjI1MTgsIm5iZiI6MTY1OTE5ODUxOCwianRpIjoiTmo0ZnIzRXdxaGVVZURyaSJ9.MHGw3rRrE-CpkqTxe0bOV2P-6-yAhOzh09pZ7SqT2jA",
                    status: "Active"
                }
            ];

            for (let i = 0; i < courierDetails.length; i++) {
                const courier = courierDetails[i];
                if (courier.couriorServiceName == "Pickrr") {
                    //pickrrToken = courier.pickrrToken;
                    var index = courierType.map(function (x) { return x.type; }).indexOf("pickrr");
                    courierType[index].auth_token = courier.pickrrToken;
                }

                if (courier.couriorServiceName == "Delhivery") {
                    //delhiveryToken = courier.delhiveryToken;
                    var index = courierType.map(function (x) { return x.type; }).indexOf("delhivery");
                    courierType[index].token = courier.delhiveryToken;
                }

                if (courier.couriorServiceName == "Shiprocket") {
                    if (courier.shipRocketToken && courier.shipRocketToken != "") {
                        var index = courierType.map(function (x) { return x.type; }).indexOf("shiprocket");
                        courierType[index].token = courier.shipRocketToken;
                    } else {
                        var apiUrl = "https://apiv2.shiprocket.in/v1/external/auth/login";
                        var requestData = {
                            "email": courier.shiprocketUsername,
                            "password": courier.shiprocketPassword
                        }
                        const tokenResponce = await axios.post(apiUrl, requestData);
                        if (tokenResponce.status == 200 && tokenResponce.data && tokenResponce.data.token) {
                            var index = courierType.map(function (x) { return x.type; }).indexOf("shiprocket");
                            courierType[index].token = tokenResponce.data.token;
                            var docId = courier.id;
                            var docData = {
                                shipRocketToken: tokenResponce.data.token
                            };
                            var options = { 'upsert': true, returnOriginal: false };
                            CourierModel.findByIdAndUpdate(docId, docData, options, function (error, response) {
                                if (error) {
                                    console.log("Failed to update Shiprocket token");
                                } else {
                                    //shipRocketToken = response.token
                                    console.log("Shiprocket token updated");
                                }
                            });
                        }
                    }
                }
            }
            // courierDetails.map(async courier => {
            //     if (courier.couriorServiceName == "Pickrr") {
            //         //pickrrToken = courier.pickrrToken;
            //         var index = courierType.map(function (x) { return x.type; }).indexOf("pickrr");
            //         courierType[index].auth_token = courier.pickrrToken;
            //     }

            //     if (courier.couriorServiceName == "Delhivery") {
            //         //delhiveryToken = courier.delhiveryToken;
            //         var index = courierType.map(function (x) { return x.type; }).indexOf("delhivery");
            //         courierType[index].token = courier.delhiveryToken;
            //     }

            //     if (courier.couriorServiceName == "Shiprocket") {
            //         if (courier.shipRocketToken && courier.shipRocketToken != "") {
            //             var index = courierType.map(function (x) { return x.type; }).indexOf("shiprocket");
            //             courierType[index].token = courier.shipRocketToken;
            //         } else {





            //             var apiUrl = "https://apiv2.shiprocket.in/v1/external/auth/login";
            //             var requestData = {
            //                 "email": courier.shiprocketUsername,
            //                 "password": courier.shiprocketPassword
            //             }
            //             const tokenResponce = await axios.post(apiUrl, requestData);

            //             console.log('tokenResponce', tokenResponce)

            //             // if (tokenResponce.status == 200) {
            //             //     if (tokenResponce.data && tokenResponce.data.token) {






            //             //const shipRocketTokenDetails = generateShipRocketToken(courier.shiprocketUsername, courier.shiprocketPassword);

            //             //shipRocketTokenDetails.then(res => {
            //                 if (tokenResponce.status == 200 && tokenResponce.data && tokenResponce.data.token) {
            //                     var docId = courier.id;
            //                     var docData = {
            //                         shipRocketToken: tokenResponce.data.token
            //                     };
            //                     var options = { 'upsert': true, returnOriginal: false };
            //                     CourierModel.findByIdAndUpdate(docId, docData, options, function (error, response) {
            //                         console.log('response', response)
            //                         if (error) {
            //                             console.log("Failed to update Shiprocker token");
            //                         } else {
            //                             //shipRocketToken = response.token
            //                             var index = courierType.map(function (x) { return x.type; }).indexOf("shiprocket");
            //                             courierType[index].token = response.shipRocketToken;
            //                         }
            //                     });
            //                 }
            //             //})
            //         }
            //     }
            // })

            let courierStatus = false;

            for (let index = 0; index < courierType.length; index++) {
                const courier = courierType[index];
                if (courier.type == "delhivery" && courier.token != "") {
                    let apiUrl = courier.url + "?token=" + courier.token + "&filter_codes=" + pincode;
                    const response = await axios.get(apiUrl);
                    if (response.status == 200) {
                        courierStatus = true;
                        break;
                    }
                }

                if (courier.type == "ecomExpress") {
                    //var FormData = require('form-data');
                    // var data = new FormData();
                    // data.append('username', courier.username);
                    // data.append('password', courier.password);

                    // var config = {
                    // method: 'post',
                    // url: 'https://clbeta.ecomexpress.in/apiv2/pincodes/',
                    // headers: { 
                    //     ...data.getHeaders()
                    // },
                    // data : data
                    // };

                    // axios(config)
                    // .then(function (response) {
                    // console.log(JSON.stringify(response.data));
                    // })
                    // .catch(function (error) {
                    // console.log(error);
                    // });

                    // let apiUrl = courier.url;
                    // let postData = {
                    //     username: courier.username,
                    //     password: courier.password
                    // }
                    // const response = await axios.post(apiUrl, {}, {
                    //     headers: {
                    //         username: courier.username,
                    //         password: courier.password
                    //     }
                    // });
                    // console.log(response);
                    //break;
                }

                if (courier.type == "pickrr" && courier.auth_token != "") {
                    for (const wirehouse of wirehouseDetails) {
                        let wireHousePincode = wirehouse.pincode;
                        let apiUrl = courier.url + "?from_pincode=" + wireHousePincode + "&to_pincode=" + pincode + "&auth_token=" + courier.auth_token;
                        const pickrrResponse = await axios.get(apiUrl);
                        if (pickrrResponse.err == null) {
                            courierStatus = true;
                            break;
                        }
                    }
                    if (courierStatus) {
                        break;
                    }
                }

                if (courier.type == "shiprocket" && courier.token != "") {
                    for (const wirehouse of wirehouseDetails) {
                        let wireHousePincode = wirehouse.pincode;
                        let apiUrl = courier.url + "?pickup_postcode=" + wireHousePincode + "&delivery_postcode=" + pincode + "&cod=0&weight=.5";
                        const shiprocketResponse = await axios.get(apiUrl, {
                            headers: {
                                "Authorization": "Bearer " + courier.token
                            }
                        });
                        if (shiprocketResponse.status == 200) {
                            courierStatus = true;
                            break;
                        }
                    }
                    if (courierStatus) {
                        break;
                    }
                }

                // if (courier.type == "bluedart") {
                //     break;
                // }
            }

            if (courierStatus) {
                let storeapiCollection = "storeapi_" + vendorId;
                const StoreapiModel = mongoose.model(storeapiCollection, models.Common);
                const storeapiDetails = await StoreapiModel.find();
                console.log("storeapiDetails", storeapiDetails);

                let shopifyStoreUrl = storeapiDetails[0].shopifyStoreUrl;
                let shopifyApiAccessToken = storeapiDetails[0].shopifyApiAccessToken;
                let shopifyApiKey = storeapiDetails[0].shopifyApiKey;
                let shopifyApiSecretKey = storeapiDetails[0].shopifyApiSecretKey;
                let shopifyApiVersion = (storeapiDetails[0].shopifyApiVersion) ? storeapiDetails[0].shopifyApiVersion : "2022-07";
                let trackInventoryLocationWise = (storeapiDetails[0].trackInventoryLocationWise) ? storeapiDetails[0].trackInventoryLocationWise : "No";

                let productApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/products/" + productId + ".json";
                const productResponse = await axios.get(productApiUrl, {
                    headers: {
                        "X-Shopify-Access-Token": shopifyApiAccessToken
                    }
                });

                if (productResponse.status == 200) {
                    let productResponseData = productResponse.data;
                    //console.log('productResponseData', productResponseData.product.variants);
                    var selectedVariant;
                    productResponseData.product.variants.forEach(variant => {
                        if (selectedOptions && selectedOptions.length > 0) {
                            var exists = selectedOptionValues.every(v => {
                                return Object.values(variant).includes(v);
                            })
                            if (exists && variant) {
                                selectedVariant = variant;
                            }
                        } else { //Simple Product
                            if (variant) {
                                selectedVariant = variant;
                            }
                        }
                    });
                    console.log('selectedVariant', selectedVariant)
                    let inventoryStatus = false;
                    if (trackInventoryLocationWise == "Yes") {
                        var locationWiseWarehouseIndexAndProductAvailable = [];
                        for (let index = 0; index < wirehouseDetails.length; index++) {
                            const wirehouse = wirehouseDetails[index];
                            if (wirehouse.shopifyLocationId) {
                                let locationInventoryApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/locations/" + wirehouse.shopifyLocationId + "/inventory_levels.json";
                                const locationInventoryResponse = await axios.get(locationInventoryApiUrl, {
                                    headers: {
                                        "X-Shopify-Access-Token": shopifyApiAccessToken
                                    }
                                });
                                if (locationInventoryResponse.status == 200) {
                                    var inventoryLevels = locationInventoryResponse.data.inventory_levels;
                                    console.log('inventoryLevels', inventoryLevels)
                                    if (inventoryLevels.some(il => il.inventory_item_id === selectedVariant.inventory_item_id && il.available > 0)) {
                                        inventoryStatus = true;
                                        locationWiseWarehouseIndexAndProductAvailable.push({
                                            warehouseIndex: index,
                                            isProductAvailable: true
                                        })
                                    }
                                }
                            }
                        }
                    } else {
                        if (selectedVariant.inventory_quantity && selectedVariant.inventory_quantity > 0) {
                            inventoryStatus = true;
                        }
                    }

                    if (inventoryStatus) {
                        let pincodeCollection = "pincodes";
                        const PincodeModel = mongoose.model(pincodeCollection, models.Common);
                        const selectedPincodeDetails = await PincodeModel.find({ Pincode: parseInt(pincode) });

                        let zones = [];
                        let wirehouseDistances = [];
                        let warehouseIndexAndDeliveryDistance = [];
                        if (wirehouseDetails.length > 0) {

                            for (let index = 0; index < wirehouseDetails.length; index++) {
                                const wirehouse = wirehouseDetails[index];
                                if (trackInventoryLocationWise == "Yes") {
                                    if (locationWiseWarehouseIndexAndProductAvailable.some(lwip => lwip.warehouseIndex === index && lwip.isProductAvailable)) {
                                        let wireHousePincode = wirehouse.pincode;
                                        const wirehousePincodeDetails = await PincodeModel.find({ Pincode: parseInt(wireHousePincode) });
                                        if (wirehousePincodeDetails.length > 0 && selectedPincodeDetails.length > 0) {
                                            if (selectedPincodeDetails[0].District == wirehousePincodeDetails[0].District) {
                                                zones.push(1); //Zone A
                                            } else if (selectedPincodeDetails[0].State == wirehousePincodeDetails[0].State) {
                                                zones.push(2); //Zone B
                                            } else if (selectedPincodeDetails[0].Zone == 'C' && wirehousePincodeDetails[0].Zone == 'C' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                                zones.push(3); //Zone C
                                            } else if (selectedPincodeDetails[0].Zone == 'E' && wirehousePincodeDetails[0].Zone == 'E' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                                zones.push(5); //Zone E
                                            } else {
                                                zones.push(4); //Zone D
                                            }

                                            let distanceAPIUrl = "https://maps.googleapis.com/maps/api/distancematrix/xml?origins=" + parseInt(wireHousePincode) + "&destinations=" + parseInt(selectedPincodeDetails[0].Pincode) + "&key=" + process.env.GOOGLE_API_KEY;
                                            const distanceResponse = await axios.get(distanceAPIUrl);
                                            if (distanceResponse.status == 200) {
                                                distanceResponseData = distanceResponse.data;
                                                xml2js.parseString(distanceResponseData, (err, result) => {
                                                    if (err) {
                                                        throw err;
                                                    } else {

                                                    }
                                                    const distanceResponseJsonData = JSON.parse(JSON.stringify(result, null, 4));
                                                    if (distanceResponseJsonData.DistanceMatrixResponse.row[0].element[0].status[0] == "OK") {
                                                        let distance = distanceResponseJsonData.DistanceMatrixResponse.row[0].element[0].distance[0].value[0];
                                                        wirehouseDistances.push(parseInt(distance));
                                                        warehouseIndexAndDeliveryDistance.push({
                                                            warehouseIndex: index,
                                                            deliveryDistance: distance
                                                        })
                                                    }
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    let wireHousePincode = wirehouse.pincode;
                                    const wirehousePincodeDetails = await PincodeModel.find({ Pincode: parseInt(wireHousePincode) });
                                    if (wirehousePincodeDetails.length > 0 && selectedPincodeDetails.length > 0) {
                                        if (selectedPincodeDetails[0].District == wirehousePincodeDetails[0].District) {
                                            zones.push(1); //Zone A
                                        } else if (selectedPincodeDetails[0].State == wirehousePincodeDetails[0].State) {
                                            zones.push(2); //Zone B
                                        } else if (selectedPincodeDetails[0].Zone == 'C' && wirehousePincodeDetails[0].Zone == 'C' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                            zones.push(3); //Zone C
                                        } else if (selectedPincodeDetails[0].Zone == 'E' && wirehousePincodeDetails[0].Zone == 'E' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                            zones.push(5); //Zone E
                                        } else {
                                            zones.push(4); //Zone D
                                        }

                                        let distanceAPIUrl = "https://maps.googleapis.com/maps/api/distancematrix/xml?origins=" + parseInt(wireHousePincode) + "&destinations=" + parseInt(selectedPincodeDetails[0].Pincode) + "&key=" + process.env.GOOGLE_API_KEY;
                                        const distanceResponse = await axios.get(distanceAPIUrl);
                                        if (distanceResponse.status == 200) {
                                            distanceResponseData = distanceResponse.data;
                                            xml2js.parseString(distanceResponseData, (err, result) => {
                                                if (err) {
                                                    throw err;
                                                } else {

                                                }
                                                const distanceResponseJsonData = JSON.parse(JSON.stringify(result, null, 4));
                                                console.log('distanceResponseData', JSON.stringify(result, null, 4));
                                                if (distanceResponseJsonData.DistanceMatrixResponse.row[0].element[0].status[0] == "OK") {
                                                    let distance = parseInt(distanceResponseJsonData.DistanceMatrixResponse.row[0].element[0].distance[0].value[0]);
                                                    wirehouseDistances.push(parseInt(distance));
                                                    warehouseIndexAndDeliveryDistance.push({
                                                        warehouseIndex: index,
                                                        deliveryDistance: parseInt(distance)
                                                    })
                                                }
                                            });
                                        }
                                    }
                                }
                            };
                        }
                        console.log('warehouseIndexAndDeliveryDistance', warehouseIndexAndDeliveryDistance);
                        let zonesCollection = "zones_" + vendorId;
                        const ZonesModel = mongoose.model(zonesCollection, models.Common);
                        const zoneDetails = await ZonesModel.find();

                        let finalZone = "";
                        const zoneNo = Math.min(...zones);
                        if (zoneNo === 1) {
                            finalZone = "Zone A";
                        } else if (zoneNo === 2) {
                            finalZone = "Zone B";
                        } else if (zoneNo === 3) {
                            finalZone = "Zone C";
                        } else if (zoneNo === 5) {
                            finalZone = "Zone E";
                        } else {
                            finalZone = "Zone D";
                        }

                        let selecteZone = zoneDetails.find(zone => zone.zoneName === finalZone);
                        let responseText2;
                        const minDistance = Math.min(...wirehouseDistances);

                        var nearestWirehouse;
                        let minDistanceIndex;
                        console.log('wirehouseDistances', wirehouseDistances)
                        if (trackInventoryLocationWise == "Yes") {
                            let objj = warehouseIndexAndDeliveryDistance.find(obj => parseInt(obj.deliveryDistance) === minDistance);
                            console.log('objj', objj)
                            minDistanceIndex = objj.warehouseIndex;
                        } else {
                            minDistanceIndex = wirehouseDistances.indexOf(minDistance);
                            
                        }
                        nearestWirehouse = wirehouseDetails[minDistanceIndex];
                        console.log('minDistance', minDistance)
                        console.log('minDistanceIndex', minDistanceIndex)
                        
                        console.log('nearestWirehouse', nearestWirehouse)

                        var pickupStartTime = nearestWirehouse.pickupTimeStart;
                        var pickupEndTime = nearestWirehouse.pickupTimeEnd;
                        var format = 'HH:mm:ss';
                        var curTime = moment().utcOffset("+05:30").format("HH:mm:ss");
                        var curMinute = moment().utcOffset("+05:30").minute();

                        var time = moment(curTime, format);
                        var beforeTime = moment(pickupStartTime, format);
                        var afterTime = moment(pickupEndTime, format);
                        //var midNight = moment('00:01', format);
                        let deliverTime = "";
                        // if(time.isAfter(midNight) && time.isBefore(beforeTime)) {
                        //     console.log('After midnight and before pickup time')
                        //     responseText2 = "order now";

                        //     if (selecteZone.shippingTime == '24 Hours') {
                        //         deliverTime = "today";
                        //     } else if (selecteZone.shippingTime == '2 days') {
                        //         deliverTime = "tomorrow";
                        //     } else {
                        //         deliverTime = "in " + selecteZone.shippingTime;
                        //     }

                        // } 

                        if (time.isBetween(beforeTime, afterTime)) {
                            var remainingMinute = 60 - curMinute;
                            responseText2 = "order withen <strong>" + remainingMinute + ' minutes</strong>';
                            console.log('is between pickup start and end time');

                            if (selecteZone.shippingTime == '24 Hours') {
                                deliverTime = "today";
                            } else if (selecteZone.shippingTime == '2 days') {
                                deliverTime = "tomorrow";
                            } else {
                                deliverTime = "in " + selecteZone.shippingTime;
                            }
                        } else if (time.isAfter(afterTime)) {
                            console.log('After pickup time')
                            responseText2 = "order <strong>now</strong>";

                            if (selecteZone.shippingTime == '24 Hours') {
                                deliverTime = "tomorrow";
                            } else if (selecteZone.shippingTime == '2 days') {
                                deliverTime = "in 3 days";
                            } else if (selecteZone.shippingTime == '3 days') {
                                deliverTime = "in 4 days";
                            } else if (selecteZone.shippingTime == '4 days') {
                                deliverTime = "in 5 days";
                            } else {
                                deliverTime = "in 6 days";
                            }
                        } else {
                            console.log('is not between')
                            responseText2 = "order <strong>now</strong>";

                            if (selecteZone.shippingTime == '24 Hours') {
                                deliverTime = "today";
                            } else if (selecteZone.shippingTime == '2 days') {
                                deliverTime = "tomorrow";
                            } else {
                                deliverTime = "in " + selecteZone.shippingTime;
                            }
                        }

                        let responseText1 = "Fastest " + selecteZone.paymentStaus.toLowerCase() + " delivery <strong>" + deliverTime + "</strong>";

                        let responseData = {
                            responseText1: responseText1,
                            responseText2: responseText2,
                            zoneName: selecteZone.zoneName,
                            shippingTime: selecteZone.shippingTime,
                            paymentStaus: selecteZone.paymentStaus,
                            deliveryCharge: selecteZone.deliveryCharge,
                        }
                        let result = {
                            status: 'success',
                            message: '',
                            data: responseData
                        };
                        res.json(result);
                    } else {
                        let result = {
                            status: 'false',
                            message: 'Product not available'
                        };
                        res.json(result);
                    }
                } else {
                    let result = {
                        status: 'false',
                        message: 'Product not found'
                    };
                    res.json(result);
                }
            } else {
                let result = {
                    status: 'false',
                    message: 'We are sorry, we can not deliver at this location.'
                };
                res.json(result);
            }
        } else {
            let result = {
                status: 'false',
                message: 'Invalid pin code, please try with correct pin code.'
            };
            res.json(result);
        }
    } catch (error) {
        console.error(error);
        let result = {
            status: 'false',
            message: 'Invalid pin code, please try with correct pin code.'
        };
        res.json(result);
    }
}

module.exports = {
    checkPin
}