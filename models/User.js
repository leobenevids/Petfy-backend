const mongoose = require("../db/conn");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("UserSchema", UserSchema);
