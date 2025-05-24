const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Consultant = require("../models/consultant");
const User = require("../models/user");
const Waitinglistconsultant = require("../models/waitinglistconsultant");
const { isAuth } = require("../middleware/auth"); // Import the isAuth middleware

// Create a new consultant (Authenticated route)
exports.createConsultant = [
  isAuth,
  async (req, res) => {
    try {
      const { name, expertise, location, bio, email, password, phone } = req.body;

      // Ensure the user is a SuperAdmin before creating a consultant
      if (!req.user.isSuperAdmin) {
        return res
          .status(403)
          .json({ message: "Access denied. SuperAdmin only." });
      }

      // Check if the email already exists
      const existingConsultant = await Consultant.findOne({ email });
      if (existingConsultant) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create a new consultant
      // const consultant = new Consultant({
      //   name,
      //   expertise,
      //   location,
      //   bio,
      //   email,
      //   password,
      //   phone
      // });

      //await consultant.save();
      //for waiting list
const consultant = new Waitinglistconsultant({
        name,
        expertise,
        location,
        bio,
        email,
        password,
        phone
      });
      await consultant.save();
      //end
      res.status(201).json({
        success: true,
        message: "Consultant created successfully!",
        consultant,
      });
    } catch (error) {
      console.error("Error creating consultant:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

exports.getAllConsultants = [
  isAuth,
  async (req, res) => {
    try {
      const consultants = await Consultant.find();
      return res.status(200).json({ success: true, consultants });
    } catch (error) {
      console.error("Error fetching consultants:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

// Update consultant details (Authenticated route)
exports.editConsultant = [
  isAuth,
  async (req, res) => {
    try {
      const { id, name, expertise, location, bio, phone } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Consultant ID is required!" });
      }

      // Find the consultant by ID and update their details
      const updatedConsultant = await Consultant.findByIdAndUpdate(
        id,
        { name, expertise, location, bio, phone },
        { new: true }
      );

      if (!updatedConsultant) {
        return res
          .status(404)
          .json({ success: false, message: "Consultant not found!" });
      }

      res.status(200).json({
        success: true,
        message: "Consultant updated successfully!",
        updatedConsultant,
      });
    } catch (error) {
      console.error("Error updating consultant:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

// Delete a consultant (Authenticated route)
exports.deleteConsultant = [
  isAuth,
  async (req, res) => {
    try {
      const { id } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Consultant ID is required!" });
      }

      // Find and delete the consultant by ID
      const deletedConsultant = await Consultant.findByIdAndDelete(id);

      if (!deletedConsultant) {
        return res
          .status(404)
          .json({ success: false, message: "Consultant not found!" });
      }

      res
        .status(200)
        .json({ success: true, message: "Consultant deleted successfully!" });
    } catch (error) {
      console.error("Error deleting consultant:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

// Consultant login (Public route)
exports.consultantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const consultant = await Consultant.findOne({ email });

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Invalid consultant email!",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, consultant.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email or password does not match!",
      });
    }

    const token = jwt.sign(
      { consultantId: consultant._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Consultant logged in successfully!",
      token,
      consultant,
    });
  } catch (error) {
    console.error("Error logging in consultant:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Get a list of consultants waiting for approval (Admin view) (Authenticated route)
exports.getWaitingListConsultant = async (req, res) => {
  try {
    // Fetch the waiting list of consultants from the database
    const waitinglistconsultant = await Waitinglistconsultant.find();

    // Return the waiting list consultants
    return res.status(200).json({
      success: true,
      message: "Waiting list retrieved successfully",
      waitinglistconsultant,
    });
  } catch (error) {
    console.error("Error fetching waiting list consultants:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Edit consultant status (Approve/Reject) (Admin view) (Authenticated route)
exports.editConsultantStatus = [
  isAuth,
  async (req, res) => {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. SuperAdmin only.",
      });
    }

    const { id, action } = req.body;
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        message: "Please provide consultant ID and action to edit status",
      });
    }

    const waitinglistconsultant = await Waitinglistconsultant.findById(id);
    if (!waitinglistconsultant) {
      return res
        .status(404)
        .json({ success: false, message: "Consultant not found" });
    }

    switch (action) {
      case "REJECT":
        await Waitinglistconsultant.findByIdAndDelete(id);
        return res.status(200).json({
          success: true,
          message: "Consultant rejected successfully!",
        });
      case "APPROVE":
        const consultant = new Consultant(waitinglistconsultant.toObject());
        await consultant.save();
        await Waitinglistconsultant.findByIdAndDelete(id);
        return res.status(200).json({
          success: true,
          message: "Consultant approved successfully!",
        });
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid action" });
    }
  },
];
