const express = require("express");
const router = express.Router();
const solicitacaoTopicoForumController = require("../controllers/controllerSolicitacaoTopicoForum");
const {validation} = require('../middleware/jwtMiddleware');

router.post("/", validation, solicitacaoTopicoForumController.criarSolicitacao);
router.get("/", validation, solicitacaoTopicoForumController.listarSolicitacoes);
router.put("/:id", validation, solicitacaoTopicoForumController.atualizarEstado);

module.exports = router;
