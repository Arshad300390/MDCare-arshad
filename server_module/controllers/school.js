const School = require("../models/school");
const { isAuth } = require("../middleware/auth");
const Waitinglist = require("../models/waitinglist");
const User = require("../models/user");
const crypto = require("crypto");
const cloudinary = require("../helper/imageUpload");

// Middleware for checking if the user is superAdmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this resource",
    });
  }
  next();
};

// exports.createSchool = async (req, res) => {
//   try {
//     const {
//       name,
//       location,
//       description,
//       specialties,
//       Rating,
//       email,
//       password,
//       phone,
//     } = req.body;

//     const isThisEmailInUse =
//       (await Waitinglist.findOne({ email })) ||
//       (await School.findOne({ email }));
//     if (isThisEmailInUse) {
//       return res.status(400).json({ message: "Email already in use" });
//     }
//     let imageUrl = null;
//     if (!!req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "schoolPics",
//         crop: "limit",
//         width: 800,
//         height: 800,
//       });
//       if (result?.secure_url) {
//         imageUrl = result.secure_url;
//       }
//     }

//     const school = new Waitinglist({
//       email,
//       password,
//       name,
//       location,
//       description,
//       specialties,
//       Rating,
//       phone,
//       ...(imageUrl && { pic: imageUrl }),
//     });
//     await school.save();

//     return res.status(201).json({
//       success: true,
//       message: "School has been added to the waiting list!",
//       school,
//     });
//   } catch (error) {
//     console.error("Error creating school:", error.message);
//     res.status(500).json({ success: false, message: "Server error!" });
//   }
// };

exports.createSchool = async (req, res) => {
  try {
    // Handle location: support both object and flat fields
    let location = req.body.location;
    if (
      req.body['location[type]'] &&
      req.body['location[coordinates][0]'] !== undefined &&
      req.body['location[coordinates][1]'] !== undefined
    ) {
      location = {
        type: req.body['location[type]'],
        coordinates: [
          parseFloat(req.body['location[coordinates][0]']),
          parseFloat(req.body['location[coordinates][1]'])
        ]
      };
    } else if (typeof location === 'string') {
      // If sent as JSON string (sometimes happens with multipart)
      try {
        location = JSON.parse(location);
      } catch (e) {
        location = undefined;
      }
    }

    // Handle specialties: support both array and single string
    let specialties = req.body['specialties[]'] || req.body.specialties;
    if (typeof specialties === 'string') {
      specialties = [specialties];
    }
    if (!Array.isArray(specialties)) {
      specialties = [];
    }

    const {
      name,
      description,
      Rating,
      email,
      password,
      phone,
    } = req.body;

    const isThisEmailInUse =
      (await Waitinglist.findOne({ email })) ||
      (await School.findOne({ email }));
    if (isThisEmailInUse) {
      return res.status(400).json({ message: "Email already in use" });
    }
    let imageUrl = null;
    if (!!req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "schoolPics",
        crop: "limit",
        width: 800,
        height: 800,
      });
      if (result?.secure_url) {
        imageUrl = result.secure_url;
        console.log(imageUrl);
      }
    }

    const school = new Waitinglist({
      email,
      password,
      name,
      location,
      description,
      specialties,
      Rating,
      phone,
      ...(imageUrl && { pic: imageUrl }),
    });
    await school.save();

    return res.status(201).json({
      success: true,
      message: "School has been added to the waiting list!",
      school,
    });
  } catch (error) {
    console.error("Error creating school:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};


exports.getWaitingList = async (req, res) => {
  try {
    let userDetails = null;

    // Check if the request has an authorization header
    // const token = req.headers.authorization?.split(" ")[1];
    // if (token) {
    //   try {
    //     // Verify the token and get user details
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     const user = await User.findById(decoded.userId);
    //     if (user) {
    //       userDetails = {
    //         id: user._id,
    //         fullname: user.fullname,
    //         email: user.email,
    //         isSuperAdmin: user.superAdmin || false,
    //       };
    //     }
    //   } catch (err) {
    //     console.warn("Token verification failed:", err.message);
    //   }
    // }

    const waitingList = await Waitinglist.find();
console.log(waitingList)
    return res.status(200).json({
      success: true,
      message: "Waiting list retrieved successfully",
      waitingList,
     // userDetails: userDetails || null, // Include user details only if authenticated
    });
  } catch (error) {
    console.error("Error fetching waiting list:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};

exports.getAllSchools = [
  isAuth,
  async (req, res) => {
    try {
      const schools = await School.find();
      return res.status(200).json({ success: true, schools });
    } catch (error) {
      console.error("Error fetching schools:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

exports.editSchoolStatus = [
  isAuth,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { id, action } = req.body;
      if (!id || !action) {
        return res.status(400).json({
          success: false,
          message: "Please provide school id and action to edit status",
        });
      }

      const waitingListSchool = await Waitinglist.findById(id);
      if (!waitingListSchool) {
        return res
          .status(404)
          .json({ success: false, message: "School not found" });
      }

      if (action === "REJECT") {
        await Waitinglist.findByIdAndDelete(id);
        return res
          .status(200)
          .json({ success: true, message: "School rejected successfully!" });
      }

      if (action === "APPROVE") {
        const school = new School({
          email: waitingListSchool.email,
          password: waitingListSchool.password,
          description: waitingListSchool.description,
          name: waitingListSchool.name,
          location: waitingListSchool.location,
          specialties: waitingListSchool.specialties,
          phone: waitingListSchool.phone,
        });
        await school.save();
        await Waitinglist.findByIdAndDelete(id);
        return res
          .status(200)
          .json({ success: true, message: "School approved successfully!" });
      }

      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    } catch (error) {
      console.error("Error editing school status:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

exports.deleteSchool = [
  isAuth,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "School ID is required!" });
      }

      const deletedSchool = await School.findByIdAndDelete(id);
      if (!deletedSchool) {
        return res
          .status(404)
          .json({ success: false, message: "School not found!" });
      }

      res.status(200).json({
        success: true,
        message: "School deleted successfully!",
        deletedSchool,
      });
    } catch (error) {
      console.error("Error deleting school:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

exports.editSchool = [
  isAuth,
  isSuperAdmin,
  async (req, res) => {
    try {
      const { id, name, location, description, specialties, rating } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "School ID is required!" });
      }

      const updatedSchool = await School.findByIdAndUpdate(
        id,
        { name, location, description, specialties, rating, phone },
        { new: true }
      );

      if (!updatedSchool) {
        return res
          .status(404)
          .json({ success: false, message: "School not found!" });
      }

      res.status(200).json({
        success: true,
        message: "School updated successfully!",
        updatedSchool,
      });
    } catch (error) {
      console.error("Error updating school:", error.message);
      res.status(500).json({ success: false, message: "Server error!" });
    }
  },
];

exports.schoolLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const school = await School.findOne({ email });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Invalid school email!",
      });
    }

    const isMatch = await school.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email or password does not match!",
      });
    }

    const token = jwt.sign({ schoolId: school._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      success: true,
      message: "School logged in successfully!",
      token,
      school,
    });
  } catch (error) {
    console.error("Error logging in school:", error.message);
    res.status(500).json({ success: false, message: "Server error!" });
  }
};




exports.updateSchoolProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized access!" });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const schoolIdFromToken = new mongoose.Types.ObjectId(decoded.schoolId);

    const schoolIdFromRequest = req.body._id; 
y
    if (!schoolIdFromToken.equals(schoolIdFromRequest)) {
      return res.status(403).json({ success: false, message: "Forbidden: School ID mismatch!" });
    }

    const school = await School.findById(schoolIdFromToken);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found!" });
    }

    if (school.pic) {
      const publicId = school.pic.split("/").pop().split(".")[0]; 
      await cloudinary.uploader.destroy(`schoolPics/${publicId}`);
    }

  
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "schoolPics", 
      crop: "limit",
      width: 800,
      height: 800,
    });

    if (!result || !result.secure_url) {
      return res.status(500).json({ success: false, message: "Cloudinary upload failed!" });
    }


    school.pic = result.secure_url;
    await school.save();

    res.status(200).json({ success: true, message: "School profile updated successfully!" });
  } catch (error) {
    console.error("Error uploading profile image:", error.message);
    res.status(500).json({ success: false, message: "Server error, try again later!" });
  }
};