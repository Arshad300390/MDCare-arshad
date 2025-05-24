const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("invalid image file!", false);
  }
};
const uploads = multer({ storage, fileFilter });

const {
  createSchool,
  getAllSchools,
  deleteSchool,
  editSchool,
  schoolLogin,
  getWaitingList,
  editSchoolStatus,
  updateSchoolProfile,
} = require("../controllers/school");

const { isAuth } = require("../middleware/auth");

// Apply isAuth middleware to routes where authentication is required
router.post("/create-school", isAuth, uploads.single('profile'), createSchool);
router.post("/school-waiting-status", isAuth, editSchoolStatus);
router.get("/waitinglist", getWaitingList);
router.get("/get-school", getAllSchools); // No auth needed for getting schools
router.delete("/delete-school", isAuth, deleteSchool);
router.put("/edit-school", isAuth, editSchool);
router.post("/school-login", schoolLogin); // No auth needed for school login
router.put("/update-school-pic", isAuth, uploads.single('profile'), updateSchoolProfile);

module.exports = router;