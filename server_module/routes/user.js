const express = require("express");
const crypto = require("crypto");

const router = express.Router();
const User = require("../models/user");
const {
  createUser,
  userSignIn,
  uploadProfile,
  signOut,
  forgotPassword,
  SearchSchool,
  SearchConsultant,
  updateLocation,
  getUser, // Added getUser controller
  getUserById,
  getResetPasswordForm, // Added getUserById controller
  createUserByAdmin,
  editUserByAdmin,
  deleteUserByAdmin,
} = require("../controllers/user");
const { isAuth } = require("../middleware/auth");
const {
  validateUserSignUp,
  userVlidation,
  validateUserSignIn,
} = require("../middleware/validation/user");

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

router.post("/sign-up", validateUserSignUp, userVlidation, createUser);
router.post(
  "/create-user",
  uploads.single('avatar'),      
  validateUserSignUp,           
  userVlidation,
  createUserByAdmin
);
router.post("/sign-in", validateUserSignIn, userVlidation, userSignIn);
router.post("/sign-out", isAuth, signOut);
// router.post('/reset-password', resetPassword);
router.post(
  "/upload-profile",
  isAuth,
  uploads.single("profile"),
  uploadProfile,
);
router.put("/edit-user", uploads.single('avatar'), editUserByAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/search-school", SearchSchool);
router.post("/search-consultant", SearchConsultant);
router.post("/update-location-user", updateLocation);
router.get("/reset-password/:resetToken", getResetPasswordForm);
router.patch("/reset-password/:resetToken", async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required!" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token has not expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token!" });
    }

    user.password = password; // Pre-save hook will hash the password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({ message: "Server error!" });
  }
});
// POST route for handling password reset
// Routes for getUser and getUserById
router.get("/get-users", isAuth, getUser); // Get all users
router.get("/get-user-by-id/:id", isAuth, getUserById); // Get user by ID
router.delete("/delete-user/:userId", isAuth, deleteUserByAdmin);
module.exports = router;
