const User = require("../../models/user");
const Follower = require("../../models/user_followers");
const db = require("../../db/config");
const { QueryTypes } = require("sequelize");
const userService = require("./user.service");
const bcrypt = require("bcryptjs");

// Đăng kí tài khoản
exports.signUp = async function (req, res, next) {
  try {
    const users = {
      email: req.body.email,
      password: req.body.password,
      birth: req.body.birth,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      avatar: req.body.avatar,
    };
    await userService.signUp(users);
    res.status(200).json({
      status: "Success",
      code: null,
      message: "Register successful!",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

// Đăng nhập tài khoản
exports.signIn = async (req, res) => {
  try {
    const users = {
      email: req.body.email,
      password: req.body.password,
    };
    const accessToken = await userService.generateToken(
      users,
      process.env.ACCESS_TOKEN_SECRET
    );
    return res.json({
      status: "Success",
      code: null,
      message: "Login successful!",
      token: accessToken,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      token: null,
    });
  }
};

exports.profile = async (req, res, next) => {
  try {
    let result = await userService.profile(req.id);
    return res.json({
      status: "Success",
      code: null,
      message: null,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

// Lấy tất cả Users đang theo dõi và được theo dõi
exports.getFollower = async (req, res) => {
  try {
    let status = req.query.status;
    let result = await userService.getFollow(req.id, status);
    return res.json({
      status: "Success",
      code: null,
      message: null,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

// find users by name
exports.searchUserByName = async (req, res) => {
  try {
    let name = req.query.name;
    let result = await userService.searchUsers(req.id, name);
    return res.json({
      status: "Success",
      code: null,
      message: null,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

// follow/unfollow users
exports.changeFollow = async (req, res) => {
  try {
    let results = await userService.follow(req.id, req.params.id);
    return res.json({
      status: "Success",
      code: null,
      message: results,
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

// find Images by caption/user/Created_at
exports.searchImage = async (req, res) => {
  try {
    let caption = req.query.caption;
    let userPost = req.query.userPost;
    let startDateTime = req.query.startDateTime;
    let endDateTime = req.query.endDateTime;

    let result = await userService.getImageBy(
      caption,
      userPost,
      startDateTime,
      endDateTime
    );
    return res.json({
      status: "Success",
      code: null,
      message: null,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      code: err.code,
      message: err.message,
      data: null,
    });
  }
};

exports.userProfile = async (req, res, next) => {
  try {
    let result = await userService.userProfile(req.email);
    return res.json({
      status: "Success",
      errorCode: null,
      message: null,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      errorCode: err.code,
      message: err.message,
      data: null,
    });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    let email = req.email;
    let user = req.body;
    await userService.updateUser(email, user);
    return res.json({
      status: "Success",
      errorCode: null,
      message: null,
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      errorCode: err.code,
      message: err.message,
      data: null,
    });
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    let email = req.email;
    let avatar = req.body;
    await userService.updateAvatar(email, avatar);
    return res.json({
      status: "Success",
      errorCode: null,
      message: null,
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      errorCode: err.code,
      message: err.message,
      data: null,
    });
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    let email = req.email;
    await userService.deleteAvatar(email);
    return res.json({
      status: "Success",
      errorCode: null,
      message: null,
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Error",
      errorCode: err.code,
      message: err.message,
      data: null,
    });
  }
};
