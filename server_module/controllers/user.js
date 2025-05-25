const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");
const cloudinary = require("../helper/imageUpload");
const sendEmail = require("../helper/emailHelper"); // Email helper to send emails
const {
  sendWelcomeEmail,
  transport,
  sendResetPasswordEmail,
} = require("../utils/nodeMailer");
const School = require("../models/school");
const Consultant = require("../models/consultant");
// const sendEmail = () => {
//   sendWelcomeEmail
// }

// Create User
exports.createUser = async (req, res) => {
  try {
    const { fullname, email, password, superAdmin } = req.body; // Include superAdmin
    const isNewUser = await User.isThisEmailInUse(email);

    if (!isNewUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use, try signing in.",
      });
    }

    const user = new User({ fullname, email, password, superAdmin }); // Pass superAdmin to the model
    await user.save();
    sendWelcomeEmail(user);

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};
//create users by admin with picture
exports.createUserByAdmin = async (req, res) => {
  console.log("inside createUserByAdmin");
  try {
    const { fullname, email, password, superAdmin, latitude, longitude } = req.body;

    // Validate latitude and longitude
    if (
      longitude === undefined || latitude === undefined ||
      longitude === '' || latitude === '' ||
      isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude))
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude and Latitude are required and must be valid numbers!",
      });
    }

    const isNewUser = await User.isThisEmailInUse(email);

    if (!isNewUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use, try signing in.",
      });
    }

    let avatarUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "userAvatars",
        crop: "limit",
        width: 600,
        height: 600,
      });
      if (result?.secure_url) {
        avatarUrl = result.secure_url;
      }
    }

    const user = new User({
      fullname,
      email,
      password,
      superAdmin,
      ...(avatarUrl && { avatar: avatarUrl }),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    await user.save();
    sendWelcomeEmail(user);

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.editUserByAdmin = async (req, res) => {
  try {
    const { id, fullname, email, superAdmin } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required!",
      });
    }

    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Prepare update object
    const updateData = { fullname, email, superAdmin };

    // Handle image upload if file is present
    if (req.file) {
      // Delete previous image from Cloudinary if exists
      if (user.avatar) {
        const parts = user.avatar.split('/');
        const fileName = parts[parts.length - 1];
        const publicId = 'userAvatars/' + fileName.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "userAvatars",
        crop: "limit",
        width: 600,
        height: 600,
      });
      if (result?.secure_url) {
        updateData.avatar = result.secure_url;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error editing user:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar) {
      const parts = user.avatar.split('/');
      const fileName = parts[parts.length - 1];
      const publicId = 'userAvatars/' + fileName.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};
// User Sign In with SuperAdmin Check
exports.userSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("inside userSignIn");
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the given email!",
      });
    }

    // Check if the password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email or password does not match!",
      });
    }

    // Generate JWT token without expiration
    const token = jwt.sign(
      { userId: user._id, isSuperAdmin: user.superAdmin }, // Include superAdmin in the payload
      process.env.JWT_SECRET
    );

    // Prepare user info to send back
    const userInfo = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      avatar: user.avatar || "",
      isSuperAdmin: user.superAdmin, // Return superAdmin status
    };
    res.json({ success: true, user: userInfo, token });
  } catch (error) {
    console.error("Error signing in:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Get User
exports.getUser = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Get User By Id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the given ID!",
      });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user by ID:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the given email!",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetURL = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;
    const message = `You are receiving this email because you requested a password reset. Click the link below to reset your password: \n\n ${resetURL}`;
    await sendResetPasswordEmail(user, resetURL);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email!",
    });
  } catch (error) {
    console.error("Error during forgot password:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

// Reset Password

exports.getResetPasswordForm = async (req, res) => {
  try {
    const { resetToken } = req.params;

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token has not expired
    });

    if (!user) {
      return res.status(400).send("Invalid or expired reset token!");
    }

    // Serve the password reset form
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f3f3f3;
          }
          form {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          button {
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <form id="resetPasswordForm">
          <h2>Reset Your Password</h2>
          <label for="password">New Password:</label>
          <input type="password" id="password" name="password" minlength="8" required />

          <label for="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" minlength="8" required />

          <button type="submit">Reset Password</button>
        </form>
        <script>
          const form = document.getElementById('resetPasswordForm');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
              alert('Passwords do not match!');
              return;
            }

            try {
              // Send a fetch request to update the password
              const response = await fetch('/api/auth/reset-password/${resetToken}', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
              });

              if (response.ok) {
                alert('Password updated successfully!');
                window.close(); // Close the tab
              } else {
                const { message } = await response.json();
                alert(message || 'Failed to reset password!');
              }
            } catch (error) {
              console.error('Error resetting password:', error);
              alert('Something went wrong! Please try again.');
              alert(error);
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error displaying reset password form:", error.message);
    res.status(500).send("Server error!");
  }
};

// Upload Profile
exports.uploadProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userIdFromToken = new mongoose.Types.ObjectId(decoded.userId);
    const userIdFromRequest = req.user.id; // Access userId from req.user

    console.log("userIdFromToken:", userIdFromToken);
    console.log("userIdFromRequest:", userIdFromRequest);
    console.log("req.user:", req.user);

    if (!userIdFromToken.equals(userIdFromRequest)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: User ID mismatch!" });
    }

    const user = await User.findById(userIdFromToken);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access!" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: `${user._id}_profile`,
      width: 500,
      height: 500,
      crop: "fill",
    });
    if (!result || !result.secure_url) {
      return res.status(500).json({ success: false, message: "Cloudinary upload failed!" });
    }
    user.avatar = result.secure_url;
    await user.save();

    res
      .status(201)
      .json({ success: true, message: "Your profile has been updated!" });
  } catch (error) {
    console.error("Error uploading profile image:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error, try again later!" });
  }
};

// Sign Out
exports.signOut = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization failed!" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access!" });
    }

    // Sign-out success response (no need to modify the database)
    res.json({ success: true, message: "Signed out successfully!" });
  } catch (error) {
    console.error("Error signing out:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.SearchSchool = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization failed!" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access!" });
  }

  const { name, longitude, latitude, maxDistance } = req.body;

  try {
    // Create a query object
    const query = {};

    // Search by school name (case-insensitive)
    if (name) {
      query.name = { $regex: name, $options: "i" }; // 'i' makes it case-insensitive
    }

    // Search by location (if latitude and longitude are provided)
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)], // Ensure correct number format
          },
          $maxDistance: maxDistance ? parseInt(maxDistance) : 5000, // Default to 5000 meters if not provided
        },
      };
    }

    // Fetch schools based on the query
    const schools = await School.find(query);
    res.status(200).json(schools);
  } catch (error) {
    console.error("Error searching schools:", error.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while searching for schools",
    });
  }
};

exports.SearchConsultant = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization failed!" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access!" });
  }

  const { name, longitude, latitude, maxDistance } = req.body;

  try {
    // Create a query object
    const query = {};

    // Search by school name (case-insensitive)
    if (name) {
      query.name = { $regex: name, $options: "i" }; // 'i' makes it case-insensitive
    }

    // Search by location (if latitude and longitude are provided)
    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)], // Ensure correct number format
          },
          $maxDistance: maxDistance ? parseInt(maxDistance) : 5000, // Default to 5000 meters if not provided
        },
      };
    }

    // Fetch schools based on the query
    const consultant = await Consultant.find(query);
    res.status(200).json({ success: true, consultant });
  } catch (error) {
    console.error("Error searching consultant:", error.message);
    res.status(500).json({
      success: false,
      error: "An error occurred while searching for consultant",
    });
  }
};

exports.updateLocation = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization failed!" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and Latitude are required!",
      });
    }

    const locationUpdate = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    await User.findByIdAndUpdate(
      decoded.userId,
      { location: locationUpdate },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Location updated successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
