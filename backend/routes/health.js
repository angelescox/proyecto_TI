//Requerimientos
const express = require ("express");
const router = express.Router();
const HealthController = require("../controllers/health");


//Definir rutas
router.get("/health", HealthController.HealthTest)


//Exportar router
module.exports = router