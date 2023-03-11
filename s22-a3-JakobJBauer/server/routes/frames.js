const express = require('express');
const routes = express.Router();

const fs = require('fs');
const path = require('path');

const frames = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/frames.json')));


routes.get('/', (req, res) => {
    res.send(frames.map(frame => {
        return {
            style: frame.id,
            label: frame.label,
            slice: frame.border.slice,
            cost: frame.cost
        };
    }));
})

routes.get('/:style/:imageType', (req, res) => {
    if (req.params.imageType !== 'thumbImage' && req.params.imageType !== 'borderImage') return res.sendStatus(404);
    const frame = frames.filter(frame => frame.id === req.params.style)[0];
    if (!frame) return res.sendStatus(404);
    const imageFile = path.join(__dirname, '../resources/', (req.params.imageType === 'thumbImage' ? frame.image : frame.border.image));
    if (!fs.existsSync(imageFile)) return res.sendStatus(404);
    res.sendFile(imageFile);
})

module.exports = routes;