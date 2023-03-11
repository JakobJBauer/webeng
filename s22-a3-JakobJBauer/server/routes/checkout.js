/**
 * This module contains the routes under /cart/checkout
 */

'use strict';

const express = require('express');
const routes = express.Router();

const fetch = require('node-fetch');
const { writeOrder } = require('../utils/order');
const fs = require('fs');
const path = require('path');
const Session = require("../utils/session");
const Cart = require("../utils/cart");
const {calculatePrice} = require("../utils/price");

const openOrders = {};

const sessionCookieName = 'sessionId';

const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s22/bling'

async function createPaymentIntent(amount) {
    const res = await fetch(BLING_BASE_URL + '/payment_intents', {
        method: 'POST',
        headers: {
            Authorization: "Basic " + Buffer.from(process.env.BLING_API_KEY + ':').toString('base64'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'amount': amount,
            'currency': "eur",
            'webhook': process.env.ARTMART_BASE_URL + '/checkout/payment-update'
        })
    });
    if (!res.ok) {
        return null;
    }
    return await res.json();
}

const destinations = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/shipping.json')));
const shippingCosts = {};
for (const dest of destinations.countries) {
  shippingCosts[dest.isoCode] = dest;
}

function loadCart(sid) {
    const session = Session.load(sid);
    if (!session.cart) session.cart = new Cart();
    return session.cart;
}

function isValidPayload(body) {
    return !(body.email === undefined ||
        body.shipping_address === undefined ||
        body.shipping_address.name === undefined ||
        body.shipping_address.address === undefined ||
        body.shipping_address.city === undefined ||
        body.shipping_address.country === undefined ||
        body.shipping_address.postal_code === undefined
    );
}

function isValidWebhookPayload(body) {
    return !(
        body.id === undefined ||
        body.created_at === undefined ||
        body.type === undefined ||
        body.payment_intent === undefined ||
        body.payment_intent.id === undefined ||
        body.payment_intent.client_secret === undefined ||
        body.payment_intent.amount === undefined ||
        body.payment_intent.currency === undefined ||
        body.payment_intent.created_at === undefined ||
        body.payment_intent.webhook === undefined ||
        body.payment_intent.status === undefined ||
        body.payment_intent.card === undefined ||
        body.payment_intent.card.cardholder === undefined ||
        body.payment_intent.card.last4 === undefined ||
        body.payment_intent.card.exp_month === undefined ||
        body.payment_intent.card.exp_year === undefined
    );
}

function getShippingCost(countryObj, subtotal) {
    return countryObj.freeShippingPossible && countryObj.freeShippingThreshold >= subtotal ? 0 : countryObj.price;
}

function getItemPrice(cartItem) {
    return calculatePrice(cartItem.printSize, cartItem.frameStyle, cartItem.frameWidth, cartItem.matWidth);
}

/** TODO: add checkout routes  */
routes.post('/', async(req, res) => {
    const sid = req.cookies[sessionCookieName];
    if (!sid || !Session.load(sid)) return res.sendStatus(403);

    const cartItems = loadCart(sid).getItems();

    if (!isValidPayload(req.body) || !cartItems.length) return res.sendStatus(400);

    const subtotal = cartItems.map(getItemPrice).reduce((prev, curr) => prev + curr, 0);

    const shippingCost = getShippingCost(shippingCosts[req.body.shipping_address.country], subtotal);

    const total = subtotal + shippingCost;

    const response = await createPaymentIntent(total);

    openOrders[response.id] = {...response, user_data: req.body, user_cart: cartItems, sessionId: sid};
    res.send({
        'payment_intent_id': response.id,
        'client_secret': response.client_secret,
        'amount': response.amount,
        'currency': response.currency
    });
})

routes.post('/payment-update', (req, res) => {
    if (!isValidWebhookPayload(req.body) || openOrders[req.body.payment_intent.id] === undefined)
        return res.sendStatus(400);

    const pi = req.body.payment_intent;
    const sessionId = openOrders[pi.id].sessionId;
    const user = openOrders[pi.id].user_data;
    const cart = loadCart(sessionId);
    const bought_items = openOrders[pi.id].user_cart;

    if (pi.status === 'succeeded') {
        writeOrder({
            order_date: pi.created_at,
            email: user.email,
            shipping_address: user.shipping_address,
            card: pi.card,
            amount: pi.amount,
            currency: pi.currency,
            cart: bought_items.map(item => {
                return {
                    artworkId: item.artworkId,
                    printSize: item.printSize,
                    frameStyle: item.frameStyle,
                    frameWidth: item.frameWidth,
                    matWidth: item.matWidth,
                    matColor: item.matColor,
                    price: item.price
                };
            })
        });

        bought_items.forEach(item => cart.deleteItem(item.cartItemId));
    }
    res.sendStatus(204);
})

module.exports = routes;
