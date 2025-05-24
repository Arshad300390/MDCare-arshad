const express = require("express");
const router = express.Router();

// Import controller functions
const {
  consultantLogin,
  createConsultant,
  getWaitingListConsultant,
  editConsultantStatus,
  deleteConsultant,
  getAllConsultants,
  editConsultant
} = require("../controllers/consultant");

// Define the routes
router.post("/create-consultant", createConsultant);
router.get("/get-waitinglist-consultant", getWaitingListConsultant);
router.get("/get-consultant", getAllConsultants);
router.post("/edit-consultant-waiting-status", editConsultantStatus);
router.post("/consultant-login", consultantLogin);
router.post("/delete-consultant", deleteConsultant);
router.put("/edit-consultant", editConsultant);

module.exports = router;
