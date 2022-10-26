const models = require('../models');
const mongoose = require('mongoose');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const axios = require('axios').default;

async function checkExistingCustomer(req, res) {
  var reqBody = req.body;
  const CommonModel = mongoose.model(reqBody.collection, models.Common);
  var mobile = reqBody.mobile

  CommonModel.find({ mobile: mobile }).exec(function (error, response) {
    if (error) {
      console.log(error);
      let result = {
        status: 'failed',
        message: '',
      }
      res.json(result);
    } else {
      console.log('response', response)
      var result;
      if (response.length > 0) {
        result = {
          status: 'success',
          isNewCustomer: false,
          data: response[0]
        };
      } else {
        result = {
          status: 'success',
          isNewCustomer: true,
          data: {}
        };
      }

      res.json(result);
    }
  });
}

async function sinkWirehouse(req, res) {
  try {
    let vendorId = req.body.vendorId;
    //let collection = req.body.collection;
    if (vendorId) {
      let storeapiCollection = "storeapi_" + vendorId;
      const StoreapiModel = mongoose.model(storeapiCollection, models.Common);
      const storeapiDetails = await StoreapiModel.find();
      console.log("storeapiDetails", storeapiDetails);

      let shopifyStoreUrl = storeapiDetails[0].shopifyStoreUrl;
      let shopifyApiAccessToken = storeapiDetails[0].shopifyApiAccessToken;
      let shopifyApiKey = storeapiDetails[0].shopifyApiKey;
      let shopifyApiSecretKey = storeapiDetails[0].shopifyApiSecretKey;
      let shopifyApiVersion = (storeapiDetails[0].shopifyApiVersion) ? storeapiDetails[0].shopifyApiVersion : "2022-07";

      let locationApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/locations.json";
      const locationResponse = await axios.get(locationApiUrl, {
        headers: {
          "X-Shopify-Access-Token": shopifyApiAccessToken
        }
      });
      if (locationResponse.status == 200) {
        let wirehouseCollection = "wirehouses_" + vendorId;
        const WirehouseModel = mongoose.model(wirehouseCollection, models.Common);
        const wirehouseDetails = await WirehouseModel.find();
        console.log("wirehouseDetails", wirehouseDetails);

        let locationsDetails = locationResponse.data.locations;
        console.log('locationsDetails', locationsDetails)
        let insertData = [];

        for (let index = 0; index < locationsDetails.length; index++) {
          const location = locationsDetails[index];
          if (!wirehouseDetails.some(wh => wh.locationName === location.name)) {
            insertData.push({
              "shopifyLocationId": location.id,
              "locationName": location.name,
              "phone": location.phone,
              "address1": location.address1,
              "address2": location.address2,
              "countryRegion": location.country_name,
              "state": location.province,
              "city": location.city,
              "pincode": location.zip,
              "pickupTimeStart": "10:00",
              "pickupTimeEnd": "16:00",
            })
          }
        }

        if (insertData.length > 0) {
          WirehouseModel.insertMany(insertData)
            .then(function (response) {
              let result = {
                status: 'success',
                message: '',
                data: response
              };
              res.json(result);
            }).catch(function (error) {
              let result = {
                status: 'false',
                message: 'Failed to sink wirehouse. Tyr again',
              }
              res.json(result);
            });
        } else {
          throw new Error("No wirehouse found to sink.");
        }
      }
    } else {
      throw new Error("Invalid Store.");
    }
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

async function createCart(req, res) {
  try {
    let pincode = req.body.pincode;
    let cartItems = req.body.cartItems;
    let vendorId = req.body.vendorId;

    /**
     * Fetching shopify store api details from thinkfast database.
     */
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

    /**
     * Fetching warehouse details from thinkfast database.
     */
    let wirehouseCollection = "wirehouses_" + vendorId;
    const WirehouseModel = mongoose.model(wirehouseCollection, models.Common);
    const wirehouseDetails = await WirehouseModel.find();
    console.log("wirehouseDetails", wirehouseDetails);

    let finalResponce = {
      cartId: "",
      createdAt: "",
      updatedAt: "",
      subtotalAmount: "",
      totalTaxAmount: "",
      totalDutyAmount: "",
      totalAmount: "",
      lineItems: []
    };

    /**
     * Cart item wise checking inventory & shiping
     */
    let lineItems = [];
    for (let index = 0; index < cartItems.length; index++) {
      cartItem = cartItems[index];
      let productId = cartItem.productId;
      let selectedOptions = cartItem.selectedOptions;
      let quantity = cartItem.quantity;
      let selectedOptionValues = (selectedOptions) ? selectedOptions.map(function (d) { return d["value"]; }) : [];

      /**
       * Fetching product details from shopify.
       */
      let productApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/products/" + productId + ".json";
      const productResponse = await axios.get(productApiUrl, {
        headers: {
          "X-Shopify-Access-Token": shopifyApiAccessToken
        }
      });
      if (productResponse.status == 200) {
        let productResponseData = productResponse.data;
        //console.log('productResponseData', productResponseData.product);
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

        finalResponce.lineItems.push({
          productId: productResponseData.product.id,
          cartItemId: "",
          itemName: productResponseData.product.title,
          productVariantId: selectedVariant.id,
          price: "",
          itemOptions: selectedOptions,
          itemQuantity: quantity,
          image: productResponseData.product.image.src
        })

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
                if (inventoryLevels.some(il => il.inventory_item_id === selectedVariant.inventory_item_id && il.available >= quantity)) {
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
          if (selectedVariant.inventory_quantity && selectedVariant.inventory_quantity >= quantity) {
            inventoryStatus = true;
          }
        }

        if (inventoryStatus) {
          lineItems.push({
            'quantity': quantity,
            'merchandiseId': selectedVariant['admin_graphql_api_id']
          })
        }
      }
      // else {
      //   let result = {
      //     status: 'false',
      //     errorType: 1,
      //     message: 'Product not found'
      //   };
      //   res.json(result);
      // }
    }
    console.log('lineItems', lineItems)
    const quotedLineItems = JSON.stringify(lineItems);
    const unquotedLineItems = quotedLineItems.replace(/"([^"]+)":/g, '$1:');
    console.log('unquotedLineItems', unquotedLineItems)

    let mutation = `mutation {
        cartCreate(
          input: {
            lines:  ${unquotedLineItems}
            attributes: { key: "cart_attribute", value: "This is a cart attribute" }
          }
        ) {
          cart {
            id
            createdAt
            updatedAt
            lines(first: 10) {
              edges {
                node {
                  id
                  merchandise {
                    ... on ProductVariant {
                      id,
                      price
                    }
                  }
                }
              }
            }
            attributes {
              key
              value
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
              totalDutyAmount {
                amount
                currencyCode
              }
            }
          }
        }
      }
      `;

    let checkoutMutation = `mutation {
        checkoutCreate(input: {
          lineItems: [{ variantId: "gid:\/\/shopify\/ProductVariant\/40477979050036", quantity: 1 }]
        }) {
          checkout {
             id
             webUrl
             lineItems(first: 5) {
               edges {
                 node {
                   title
                   quantity
                 }
               }
             }
          }
        }
      }
      `;
    //console.log('mutation', typeof mutation)
    ;

    let settings = {
      'async': true,
      'crossDomain': true,
      'url': 'https://fstout.myshopify.com/api/2022-07/graphql.json',
      'method': 'POST',
      'headers': {
        'X-Shopify-Storefront-Access-Token': '0e44f98e0be4bf09f6af3785ef47f76a',
        'Content-Type': 'application/graphql',
      },
      'data': mutation
    };

    console.log('settings', settings)
    //const cartResponce = await axios.post(settings);
    const cartResponce = await axios(settings);
    if (cartResponce) {
      const cartDetails = cartResponce.data.data.cartCreate.cart;

      console.log('cartDetails', cartDetails)
      const cartCostDetails = cartDetails.cost;
      const cartResponceLineItems = cartDetails.lines.edges;
      finalResponce.cartId = cartDetails.id;
      finalResponce.createdAt = cartDetails.createdAt;
      finalResponce.updatedAt = cartDetails.updatedAt;
      finalResponce.subtotalAmount = cartCostDetails.subtotalAmount;
      finalResponce.totalAmount = cartCostDetails.totalAmount;
      finalResponce.totalTaxAmount = cartCostDetails.totalTaxAmount;
      finalResponce.totalDutyAmount = cartCostDetails.totalDutyAmount;

      for (let index = 0; index < cartResponceLineItems.length; index++) {
        const cartResponceLineItem = cartResponceLineItems[index];
        finalResponce.lineItems[index].cartItemId = cartResponceLineItem.node.id;
        finalResponce.lineItems[index].price = cartResponceLineItem.node.merchandise.price;
      }
    }
    console.log('finalResponce', JSON.stringify(finalResponce))
    let result = {
      status: 'success',
      message: '',
      data: finalResponce
    };
    res.json(result);
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

async function updateCart(req, res) {
  let cartId = req.body.cartId;
  let cartItemId = req.body.cartItemId;
  let quantity = parseInt(req.body.quantity);
  try {
    let mutation = `mutation {
      cartLinesUpdate(
        cartId: "${cartId}"
        lines: {
          id: "${cartItemId}"
          quantity: ${quantity}
        }
      ) {
        cart {
          id
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
    `;

    let settings = {
      'async': true,
      'crossDomain': true,
      'url': 'https://fstout.myshopify.com/api/2022-07/graphql.json',
      'method': 'POST',
      'headers': {
        'X-Shopify-Storefront-Access-Token': '0e44f98e0be4bf09f6af3785ef47f76a',
        'Content-Type': 'application/graphql',
      },
      'data': mutation
    };

    //console.log('settings', settings)
    const cartResponce = await axios(settings);
    let finalResponce = {
      cartId: "",
      subtotalAmount: "",
      totalTaxAmount: "",
      totalDutyAmount: "",
      totalAmount: "",
      lineItems: []
    };
    //console.log('cartResponce', JSON.stringify(cartResponce.data.data))
    if (cartResponce) {
      const cartDetails = cartResponce.data.data.cartLinesUpdate.cart;
      const cartCostDetails = cartDetails.cost;
      const cartResponceLineItems = cartDetails.lines.edges;
      finalResponce.cartId = cartDetails.id;
      finalResponce.subtotalAmount = cartCostDetails.subtotalAmount;
      finalResponce.totalAmount = cartCostDetails.totalAmount;
      finalResponce.totalTaxAmount = cartCostDetails.totalTaxAmount;
      finalResponce.totalDutyAmount = cartCostDetails.totalDutyAmount;
      var lineItems = [];
      for (let index = 0; index < cartResponceLineItems.length; index++) {
        const cartResponceLineItem = cartResponceLineItems[index];
        lineItems.push({
          "cartItemId": cartResponceLineItem['node']['id'],
          "itemQuantity": cartResponceLineItem['node']['quantity'],
          "productVariantId": cartResponceLineItem['node']['merchandise']['id']
        })
      }
      finalResponce.lineItems = lineItems;
    }
    let result = {
      status: 'success',
      message: '',
      data: finalResponce
    };
    res.json(result);
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

async function retrieveCheckoutURL(req, res) {
  let cartId = req.body.cartId;
  try {
    let mutation = `query checkoutURL {
      cart(id: "${cartId}") {
        checkoutUrl
      }
    }
    `;

    let settings = {
      'async': true,
      'crossDomain': true,
      'url': 'https://fstout.myshopify.com/api/2022-07/graphql.json',
      'method': 'POST',
      'headers': {
        'X-Shopify-Storefront-Access-Token': '0e44f98e0be4bf09f6af3785ef47f76a',
        'Content-Type': 'application/graphql',
      },
      'data': mutation
    };

    //console.log('settings', settings)
    const cartResponce = await axios(settings);
    let finalResponce = {
      cartId: "",
      subtotalAmount: "",
      totalTaxAmount: "",
      totalDutyAmount: "",
      totalAmount: "",
      lineItems: []
    };
    console.log('cartResponce', JSON.stringify(cartResponce.data.data))
    // if (cartResponce) {
    //   const cartDetails = cartResponce.data.data.cartLinesUpdate.cart;
    //   const cartCostDetails = cartDetails.cost;
    //   const cartResponceLineItems = cartDetails.lines.edges;
    //   finalResponce.cartId = cartDetails.id;
    //   finalResponce.subtotalAmount = cartCostDetails.subtotalAmount;
    //   finalResponce.totalAmount = cartCostDetails.totalAmount;
    //   finalResponce.totalTaxAmount = cartCostDetails.totalTaxAmount;
    //   finalResponce.totalDutyAmount = cartCostDetails.totalDutyAmount;
    //   var lineItems = [];
    //   for (let index = 0; index < cartResponceLineItems.length; index++) {
    //     const cartResponceLineItem = cartResponceLineItems[index];
    //     lineItems.push({
    //       "cartItemId": cartResponceLineItem['node']['id'],
    //       "itemQuantity": cartResponceLineItem['node']['quantity'],
    //       "productVariantId": cartResponceLineItem['node']['merchandise']['id']
    //     })
    //   }
    //   finalResponce.lineItems = lineItems;
    // }
    let result = {
      status: 'success',
      message: '',
      data: finalResponce
    };
    res.json(result);
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

async function updateCartDiscount(req, res) {
  let cartId = req.body.cartId;
  let discountCode = req.body.discountCode;
  try {
    let mutation = `mutation {
      cartDiscountCodesUpdate(
        cartId: "${cartId}"
        discountCodes: [
          "${discountCode}"
        ]
      ) {
        cart {
          id
          discountCodes {
            code
            applicable
          }
          discountAllocations {
            discountedAmount {
              amount
            }
          }
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
            totalDutyAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
    `;

    let settings = {
      'async': true,
      'crossDomain': true,
      'url': 'https://fstout.myshopify.com/api/2022-07/graphql.json',
      'method': 'POST',
      'headers': {
        'X-Shopify-Storefront-Access-Token': '0e44f98e0be4bf09f6af3785ef47f76a',
        'Content-Type': 'application/graphql',
      },
      'data': mutation
    };

    //console.log('settings', settings)
    const cartResponce = await axios(settings);
    let finalResponce = {
      cartId: "",
      subtotalAmount: "",
      totalTaxAmount: "",
      totalDutyAmount: "",
      totalAmount: "",
      lineItems: []
    };
    console.log('cartResponce', JSON.stringify(cartResponce.data.data))
    // if (cartResponce) {
    //   const cartDetails = cartResponce.data.data.cartLinesUpdate.cart;
    //   const cartCostDetails = cartDetails.cost;
    //   const cartResponceLineItems = cartDetails.lines.edges;
    //   finalResponce.cartId = cartDetails.id;
    //   finalResponce.subtotalAmount = cartCostDetails.subtotalAmount;
    //   finalResponce.totalAmount = cartCostDetails.totalAmount;
    //   finalResponce.totalTaxAmount = cartCostDetails.totalTaxAmount;
    //   finalResponce.totalDutyAmount = cartCostDetails.totalDutyAmount;
    //   var lineItems = [];
    //   for (let index = 0; index < cartResponceLineItems.length; index++) {
    //     const cartResponceLineItem = cartResponceLineItems[index];
    //     lineItems.push({
    //       "cartItemId": cartResponceLineItem['node']['id'],
    //       "itemQuantity": cartResponceLineItem['node']['quantity'],
    //       "productVariantId": cartResponceLineItem['node']['merchandise']['id']
    //     })
    //   }
    //   finalResponce.lineItems = lineItems;
    // }
    let result = {
      status: 'success',
      message: '',
      data: finalResponce
    };
    res.json(result);
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

/**
 * Fetching discount codes from shopify store.
 * @param {*} req 
 * @param {*} res 
 */
async function getDiscountCodes(req, res) {
  try {
    //let pincode = req.body.pincode;
    //let cartItems = req.body.cartItems;
    let vendorId = req.body.vendorId;

    /**
     * Fetching shopify store api details from thinkfast database.
     */
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
    /**
     * Fetching product details from shopify.
     */
    let priceRuleApiUrl = shopifyStoreUrl + "/admin/api/" + shopifyApiVersion + "/price_rules.json";
    const priceRuleResponse = await axios.get(priceRuleApiUrl, {
      headers: {
        "X-Shopify-Access-Token": shopifyApiAccessToken
      }
    });
    if (priceRuleResponse.status == 200) {
      let priceRules = priceRuleResponse.data.price_rules;
      console.log('priceRule', JSON.stringify(priceRules));
      let resultData = [];
      for (let index = 0; index < priceRules.length; index++) {
        const priceRule = priceRules[index];
        resultData.push({
          id: priceRule.id,
          valueType: priceRule.value_type,
          value: priceRule.value,
          code: priceRule.title
        })
      }
      let result = {
        status: 'success',
        data: resultData
      };
      res.json(result);
    } else {
      let result = {
        status: 'false',
        message: 'Price rule not found'
      };
      res.json(result);
    }
  } catch (error) {
    console.error(error);
    let result = {
      status: 'false',
      message: error.message
    };
    res.json(result);
  }
}

module.exports = {
  checkExistingCustomer,
  sinkWirehouse,
  createCart,
  getDiscountCodes,
  updateCart,
  retrieveCheckoutURL,
  updateCartDiscount
}