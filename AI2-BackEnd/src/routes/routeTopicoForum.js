const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerTopicoForum');
const {validation} = require('../middleware/jwtMiddleware');

router.post('/', validation, controller.createTopicoForum);
router.get('/area/:id', validation, controller.getTopicosForumByArea);
router.get('/:id', validation, controller.getTopicoForumById);
router.put('/:id', validation, controller.updateTopicoForum);
router.delete('/:id', validation, controller.deleteTopicoForum);

module.exports = router;
