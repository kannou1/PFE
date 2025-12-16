const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuthUser } = require("../middlewares/authMiddlewares");


// GET /dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
