const router = require('express').Router();
const ctrl = require('../controllers/controllerVotosPublicacao');
const { validation } = require('../middleware/jwtMiddleware');

router.post('/:id/voto', validation, ctrl.votar);
router.get('/:id/voto', validation, ctrl.getVoteStatus); 

module.exports = router;