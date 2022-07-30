const models = require('../models');
const mongoose = require('mongoose');
const axios = require('axios').default;
var FormData = require('form-data');

async function checkPin(req, res) {
    try {
        let pincode = req.body.pincode;
        let productId = req.body.productId;
        let selectedOptions = req.body.selectedOptions;
        let selectedOptionValues = (selectedOptions) ? selectedOptions.map(function (d) { return d["value"]; }) : [];

        let wirehouseCollection = "wirehouses";
        const WirehouseModel = mongoose.model(wirehouseCollection, models.Common);
        const wirehouseDetails = await WirehouseModel.find();
        console.log("wirehouseDetails", wirehouseDetails);
        
        var courierType = [
            {
                type: "delhivery",
                url: "https://track.delhivery.com/c/api/pin-codes/json/",
                token: "8ad40a98d5cf3db63959d09fc750965e561b9ed7",
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
                auth_token: "e2495ab1f1aa403c0fcb12e9e7fffed9135608",
                status: "Active"
            },
            {
                type: "shiprocket",
                url: "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
                token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjI4NjcyNTYsImlzcyI6Imh0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9hdXRoL2xvZ2luIiwiaWF0IjoxNjU5MTk4NTE4LCJleHAiOjE2NjAwNjI1MTgsIm5iZiI6MTY1OTE5ODUxOCwianRpIjoiTmo0ZnIzRXdxaGVVZURyaSJ9.MHGw3rRrE-CpkqTxe0bOV2P-6-yAhOzh09pZ7SqT2jA",
                status: "NotActive"
            }
        ];

        let courierStatus = false;

        for (let index = 0; index < courierType.length; index++) {
            const courier = courierType[index];
            if (courier.type == "delhivery") {
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

            if (courier.type == "pickrr") {
                for (const wirehouse of wirehouseDetails) {
                    let wireHousePincode = wirehouse.pincode;
                    let apiUrl = courier.url + "?from_pincode=" + wireHousePincode + "&to_pincode=" + pincode + "&auth_token=" + courier.auth_token;
                    const pickrrResponse = await axios.get(apiUrl);
                    if(pickrrResponse.err == null) {
                        courierStatus = true;
                        break;
                    }
                }
                if(courierStatus) {
                    break;
                }
            }

            if (courier.type == "shiprocket") {
                for (const wirehouse of wirehouseDetails) {
                    let wireHousePincode = wirehouse.pincode;
                    let apiUrl = courier.url + "?pickup_postcode=" + wireHousePincode + "&delivery_postcode=" + pincode + "&cod=0&weight=.5";
                    const shiprocketResponse = await axios.get(apiUrl, {
                        headers: {
                            "Authorization": "Bearer " + courier.token
                        }
                    });
                    if(shiprocketResponse.status == 200) {
                        courierStatus = true;
                        break;
                    }
                }
                if(courierStatus) {
                    break;
                }
            }

            // if (courier.type == "bluedart") {
            //     break;
            // }
        }

        if (courierStatus) {
            let productApiUrl = "https://fstout.myshopify.com/admin/api/2022-07/products/" + productId + ".json";
            const productResponse = await axios.get(productApiUrl, {
                headers: {
                    "X-Shopify-Access-Token": "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"
                }
            });
            if (productResponse.status == 200) {
                let productResponseData = productResponse.data;
                //console.log('productResponseData', productResponseData);
                let inventoryStatus = false;
                productResponseData.product.variants.forEach(variant => {
                    //console.log('selectedOptions', selectedOptions);
                    if (selectedOptions && selectedOptions.length > 0) {
                        var exists = selectedOptionValues.every(v => {
                            return Object.values(variant).includes(v);
                        })
                        if (exists && variant.inventory_quantity > 0) {
                            inventoryStatus = true;
                        }
                    } else { //Simple Product
                        //console.log('Simple Product', variant.inventory_quantity)
                        if (variant.inventory_quantity > 0) {
                            inventoryStatus = true;
                        }
                    }
                });

                if (inventoryStatus) {
                    let pincodeCollection = "pincodes";
                    const PincodeModel = mongoose.model(pincodeCollection, models.Common);
                    const selectedPincodeDetails = await PincodeModel.find({ Pincode: parseInt(pincode) });
                    console.log("selectedPincodeDetails", selectedPincodeDetails);

                    let zones = [];
                    if (wirehouseDetails.length > 0) {
                        for (const wirehouse of wirehouseDetails) {
                            let wireHousePincode = wirehouse.pincode;
                            const wirehousePincodeDetails = await PincodeModel.find({ Pincode: parseInt(wireHousePincode) });
                            console.log("wirehousePincodeDetails", wirehousePincodeDetails);

                            if (wirehousePincodeDetails.length > 0 && selectedPincodeDetails.length > 0) {
                                if (selectedPincodeDetails[0].District == wirehousePincodeDetails[0].District) {
                                    //zones.push("Zone A");
                                    zones.push(1);
                                } else if (selectedPincodeDetails[0].State == wirehousePincodeDetails[0].State) {
                                    //zones.push("Zone B");
                                    zones.push(2);
                                } else if (selectedPincodeDetails[0].Zone == 'C' && wirehousePincodeDetails[0].Zone == 'C' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                    //zones.push("Zone C");
                                    zones.push(3);
                                } else if (selectedPincodeDetails[0].Zone == 'E' && wirehousePincodeDetails[0].Zone == 'E' && selectedPincodeDetails[0].State != wirehousePincodeDetails[0].State) {
                                    //zones.push("Zone E");
                                    zones.push(5);
                                } else {
                                    //zones.push("Zone D");
                                    zones.push(4);
                                }
                            }
                        };
                    }

                    console.log('zones', zones)

                    let zonesCollection = "zones";
                    const ZonesModel = mongoose.model(zonesCollection, models.Common);
                    const zoneDetails = await ZonesModel.find();
                    console.log("zoneDetails", zoneDetails);

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

                    let deliverTime = "";
                    if (selecteZone.shippingTime == '24 Hours') {
                        deliverTime = "today";
                    } else if (selecteZone.shippingTime == '2 days') {
                        deliverTime = "tomorrow";
                    } else {
                        deliverTime = "in " + selecteZone.shippingTime;
                    }

                    let responseText1 = "Fastest " + selecteZone.paymentStaus.toLowerCase() + " delivery " + deliverTime;
                    let responseText2 = "order now";
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
                        message: 'Product not available',
                        //productResponseData:  productResponseData
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
                message: 'Courier service is not available to your address'
            };
            res.json(result);
        }
    } catch (error) {
        console.error(error);
        let result = {
            status: 'false',
            message: 'Something wrong, contact your admin'
        };
        res.json(result);
    }
}
module.exports = {
    checkPin
}