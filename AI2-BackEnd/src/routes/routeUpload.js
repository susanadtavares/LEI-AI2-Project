const express = require('express');
// const authenticateJWT = require('../middleware/jwtMiddleware');
const router = express.Router();

const { upload_create } = require('../controllers/controllerUpload');
const { upload } = require('../middleware/uploadMiddleware');

router.post('/', upload.single('image'), upload_create);

module.exports = router;
