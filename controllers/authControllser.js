const Joi = require('joi');
const createError = require('http-errors');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const sha = require('sha256');


const {
    registration,
    login,
    logout,
    currentUser,
    setUserAvatar,
    verifyUser,
    verifyUserAgain,
} = require('../services/authService');
const { confirmMsg } = require('../services/confirmMsg');

const validateBody = (body) => {
  const schema = Joi.object({
    password: Joi.string()
      .required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
      .required(),
    subscription: Joi.string(),
  })
  return schema.validate(body);
}

const registrationController = async (req, res) => {
  if (validateBody(req.body).error) {
    throw createError(400, validateBody(req.body).error);
  }
  const { email, password, subscription } = req.body;
  const verificationToken = sha(email+process.env.JWT_SECRET);
  await registration(email, password, subscription, verificationToken);
  res.status(201).json({
    status: "201 Created",
    ResponseBody: {
      user: {
        email: email,
        subscription: subscription || "starter"
      }
    }
  })
  confirmMsg(email, verificationToken);
};
 
const loginController = async (req, res) => {
  if (validateBody(req.body).error) {
    throw createError(400, validateBody(req.body).error);
  }
  const { email, password } = req.body;
  const { token, subscription } = await login(email, password);
  res.status(200).json({
    status: "200 OK",
    ResponseBody: {
      token: token,
      user: {
        email: email,
        subscription: subscription || "starter"
      }
  }})
};

const logoutController = async (req, res) => {
  const { _id } = req.user;
  await logout(_id);
  res.status(204).json({status: "204 No Content"});
};
 
const currentUserController = async (req, res) => {
  const { _id } = req.user;
  const { email, subscription } = await currentUser(_id);
  res.status(200).json({
    status: "200 OK",
    ResponseBody: {
      user: {
        email: email,
        subscription: subscription || "starter"
      }
  }})
 };

const avatarUserController = async (req, res) => {
  const { base: fileName } = path.parse(req.urlTmp);
  let avatarURL = path.resolve('./public/avatars/', fileName);
  Jimp.read(req.urlTmp, (err, avatar) => {
      if (err) throw err;
      avatar
          .resize(250, 250)
          .write(avatarURL);
  });
  fs.unlinkSync(req.urlTmp);
  const { _id } = req.user;
  avatarURL = path.relative('./public', avatarURL);
  await setUserAvatar(_id, avatarURL);
  res.status(200).json({
    status: "200 OK",
    ResponseBody: {
      avatarURL: avatarURL
  }})
};
 
const verifyController = async (req, res) => {
  const { verificationToken } = req.params;
  await verifyUser(verificationToken);
  res.status(200).json({
    status: "200 OK",
    ResponseBody: {
      ResponseBody: {
        message: 'Verification successful'
      }
  }})
}; 
 
const verifyAgainController = async (req, res) => {
  const { email } = req.body;
  const verificationToken = await verifyUserAgain(email);
  confirmMsg(email, verificationToken);
  res.status(200).json({
    status: "200 OK",
    ResponseBody: {
      ResponseBody: {
        message: 'Verification email sent'
      }
  }})
 };

module.exports = {
  registrationController,
  loginController,
  logoutController,
  currentUserController,
  avatarUserController,
  verifyController,
  verifyAgainController,
}