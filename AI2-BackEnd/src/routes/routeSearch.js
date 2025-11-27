const express = require('express');
const router = express.Router();
const controllerSearch = require('../controllers/controllerSearch');
const {validation} = require('../middleware/jwtMiddleware');

router.get('/search', validation, controllerSearch.searchTudo);

module.exports = router;
