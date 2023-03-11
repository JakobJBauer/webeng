/**
 * This module contains the routes under /cart
 */

'use strict';

const express = require('express');
const routes = express.Router();

const Session = require('../utils/session');
const Cart = require('../utils/cart');

const sessionCookieName = 'sessionId';

/**
 * Load the cart for a given SID
 * @param sid The session id
 * @return {Cart|null} The cart, or null if the session does not exist
 */
function loadCart(sid) {
  const session = Session.load(sid);
  if (!session.cart) session.cart = new Cart();
  return session.cart;
}

function addItem(sid, item) {
  return loadCart(sid).addItem(item);
}

/**
 * Get the items for the cart associated with the user's session
 */
routes.get('/', (req, res) => {
  const sid = req.cookies[sessionCookieName] || Session.create();
  if (!Session.load(sid)) return res.sendStatus(403);
  res.cookie(sessionCookieName, sid);
  res.send(loadCart(sid).getItems());
});

routes.post('/', (req, res) => {
  const sid = req.cookies[sessionCookieName];
  if (!sid || !Session.load(sid)) return res.sendStatus(403);

  const error = addItem(sid, req.body);
  if (error) {
    res.status(400);
    return res.send(error);
  }
  res.sendStatus(201);
});

routes.delete('/', (req, res) => {
  const sid = req.cookies[sessionCookieName];
  if (!sid || !Session.load(sid)) return res.sendStatus(403);

  loadCart(sid).deleteCart();
  res.sendStatus(204);
})

routes.get('/:id', (req, res) => {
  const sid = req.cookies[sessionCookieName];
  if (!sid || !Session.load(sid)) return res.sendStatus(403);

  const item = loadCart(sid).getItem(parseInt(req.params.id))
  if (!item) return res.sendStatus(404);
  res.send(item);
})

routes.delete('/:id', (req, res) => {
  const sid = req.cookies[sessionCookieName];
  if (!sid || !Session.load(sid)) return res.sendStatus(403);

  if (!loadCart(sid).deleteItem(parseInt(req.params.id))) return res.sendStatus(404);
  res.sendStatus(204);
})

/** TODO: finish implementation */

module.exports = routes;
