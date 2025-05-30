const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  birthday: Date,
  marital_status: String,
});

UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

module.exports = mongoose.model("user", UserSchema);
