/**
 * This module contains the routes under /artworks
 */

'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const {request} = require("express");

const cache = {};

const MET_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const highlights = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/highlights.json'))).highlights;

async function fetchArtwork(id) {
  const res = await fetch(MET_BASE_URL + '/objects/' + id);
  if (!res.ok) return;
  const obj = await res.json();
  if (!obj || !obj.objectID) return;

  const customObj = {
    artworkId: obj.objectID,
    title: obj.title,
    artist: obj.artistDisplayName,
    date: obj.objectDate,
    image: obj.primaryImageSmall
  }
  cache['art' + customObj.artworkId] = customObj;
  return customObj;
}

async function getArtwork(id) {
  return cache['art' + id] || await fetchArtwork(id);
}

async function fetchSearchResult(searchTerm) {
  const res = await fetch(MET_BASE_URL + '/search?' + new URLSearchParams({hasImages: true, q: searchTerm}));
  if (!res.ok) return [];
  const obj = await res.json();
  if (!obj || !obj.objectIDs) return [];

  cache['search' + searchTerm] = obj.objectIDs;
  return obj.objectIDs;
}

async function getSearchResult(searchTerm) {
  return cache['search' + searchTerm] || await fetchSearchResult(searchTerm);
}

routes.get('/', async (req, res) => {
  const searchIds = req.query.q ? await getSearchResult(req.query.q) : highlights;
  console.log(searchIds);
  if (!searchIds.length) res.send([]);
  else res.send(await Promise.all(searchIds.map(getArtwork)));
});

routes.get('/:id', async (req, res) => {
  const artwork = await getArtwork(parseInt(req.params.id));
  if (artwork == null) {
    res.sendStatus(404);
  } else {
    res.send(artwork);
  }
});

module.exports = routes;
