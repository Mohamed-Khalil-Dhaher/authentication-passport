mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phoneNumber: Number,
  email: String,
  bio: String,
  password: String,
  provider: String,
  providerId: String,
  googleId: String,
  image: String
});
UserSchema.methods.validPassword = async function(password) {
  try {
    if (await bcrypt.compare(password, this.password)) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};
const User = mongoose.model("User", UserSchema);
const save = async ({ firstName, lastName, phoneNumber, email, bio, password }) => {
  try {
    existUsername = await User.findOne({ firstName }).exec();
    existEmail = await User.findOne({ email }).exec();
    if (!!existUsername) {
      return { err: "User with this username already exist" };
    } else if (!!existEmail) {
      return { err: "User with this email already exist" };
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        firstName,
        lastName,
        phoneNumber,
        email,
        bio,
        password: hashedPassword,
        provider: "local"
      });
      const newUser = await user.save();
      delete newUser.password;
      return newUser;
    }
  } catch (err) {
    return { errNew: err };
  }
};
const login = async ({ email, password }) => {
  try {
    user = await User.findOne({
      $or: [
        { email: email, provider: "local" },
        { firstName: email, provider: "local" }
      ]
    }).exec();
    if (!user) {
      return { err: "Firstname or Email not exist." };
    } else {
      let validPassword = await user.validPassword(password);
      if (!validPassword) {
        return { err: "Incorrect password." };
      }
      return { _id: user._id, email: user.email };
    }
  } catch (err) {
    return { errNew: err };
  }
};
const getUserById = _id => User.findById(_id);
const getUserByEmail = email =>
  User.findOne({
    $or: [
      { email: email, provider: "local" },
      { username: email, provider: "local" }
    ]
  }).exec();
const findOrCreate = async ({ provider, providerId, firstName }) => {
  try {
    let user = await User.findOne({ provider, providerId });
    if (!user) {
      const create = new User({ provider, providerId, firstName });
      user = await create.save();
    }
    return user;
  } catch (err) {
    return false;
  }
};
module.exports = {
  save,
  login,
  getUserById,
  getUserByEmail,
  findOrCreate,
  User
};
