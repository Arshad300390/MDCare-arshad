const mongoose = require("mongoose");
const School = require("./school");

const waitingListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  description: {
    type: String,
    required: true,
  },
  specialties: { type: [String], default: [], required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers: [longitude, latitude]
      required: true,
    },
  },
  pic: { type: String },
});

waitingListSchema.statics.isThisSchoolEmailInUse = async function (email) {
  if (!email) throw new Error("Invalid Email");
  try {
    const user = await this.findOne({ email });
    if (user) return false;
    const school = await School.isThisSchoolEmailInUse({ email });
    if (school) return false;

    return true;
  } catch (error) {
    console.log("Error inside isThisEmailInUse method:", error.message);
    return false;
  }
};

module.exports = mongoose.model("WaitingList", waitingListSchema);
