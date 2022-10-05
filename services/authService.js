const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const gravatar = require('gravatar');
const User = require('../models/userSchema');


const registration = async (email, password, subscription, verificationToken) => {
    const user = await User.findOne({ email });
    if (user) throw createError(409, `Email in use`);
    const avatarURL = gravatar.url(email, {protocol: 'https', s: '100', d: 'mp'});
    await User.create({ email, password, avatarURL, subscription, verificationToken });
}

const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw createError(401, `Email is wrong`);
    if (!await bcrypt.compare(password, user.password))
        throw createError(401, `Password is wrong`);
    if (!user.verify) throw createError(401, `Email not verified`);
    const token = jwt.sign({
        _id: user._id, 
    }, process.env.JWT_SECRET);
    await User.findOneAndUpdate({ email }, { token: token })
    return { token, subscription: user.subscription } ;
}

const currentUser = async (userId) => {
    return await User.findOne({ _id: userId });
}

const logout = async (userId) => {
    await User.findOneAndUpdate({ _id: userId }, { token: null })
}

const setUserAvatar = async (userId, avatar) => {
    await User.findOneAndUpdate({ _id: userId }, { avatarURL: avatar });
}

const verifyUser = async (verificationToken) => {
    const user = await User.findOne({ verificationToken });
    if (!user) throw createError(404, `User not found`);
    if (user.verify===true) throw createError(400, `Verification has already been passed`);
    await User.findOneAndUpdate({ _id: user._id }, { verify: true });
}

const verifyUserAgain = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw createError(404, `User not found`);
    if (user.verify===true) throw createError(400, `Verification has already been passed`);
    return user.verificationToken;
}

module.exports = {
  registration,
  login,
  logout,
  currentUser,
  setUserAvatar,
  verifyUser,
  verifyUserAgain,
}
