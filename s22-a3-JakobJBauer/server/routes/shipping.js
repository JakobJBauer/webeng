const express = require('express');
const routes = express.Router();

const fs = require('fs');
const path = require('path');

const destinations = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/shipping.json')));

routes.get('/', (req, res) => {
    res.send(destinations);
})

module.exports = routes;