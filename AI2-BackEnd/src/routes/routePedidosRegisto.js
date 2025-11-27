const express = require("express");
const router = express.Router();
const pedidosRegistoController = require("../controllers/controllerPedidosRegisto");

router.get("/", pedidosRegistoController.listarTodos);
router.get("/pendentes", pedidosRegistoController.listarPendentes);
router.post("/", pedidosRegistoController.criarPedido);
router.put("/aprovar/:id", pedidosRegistoController.aprovarPedido);
router.put("/rejeitar/:id", pedidosRegistoController.rejeitarPedido);

module.exports = router;
