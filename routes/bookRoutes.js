const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookControllers");
const ConsignorSheet = require("../controllers/updatesheet");
dotenv = require("dotenv");
// Correcting the route prefixes
router.get(String(process.env.API_GOL), bookController.readAllObjects);
router.post(String(process.env.API_CO), bookController.createObject);
router.get(String(process.env.API_GOLBID), bookController.readObjectById);
router.post(String(process.env.API_UO), bookController.updateObject);
router.delete(String(process.env.API_DO), bookController.deleteObject);
router.post(String(process.env.API_LC), bookController.login);
router.get(String(process.env.API_S), bookController.searchObject);
router.get(String(process.env.API_GDO), bookController.getdetails);
router.get(String(process.env.API_CronJob), bookController.cronjob);
router.get(String(process.env.API_GGsheet), ConsignorSheet.ConsignorSheet);

module.exports = router;
