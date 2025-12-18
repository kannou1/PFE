const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');

router.post('/upload', fileController.uploadFile);

module.exports = router;
