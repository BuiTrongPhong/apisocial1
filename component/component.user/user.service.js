const User = require("../../models/user");
const Post = require("../../models/post");
const Image = require("../../models/image");
const Followers = require("../../models/user_followers");
const db = require("../../db/config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { QueryTypes, sequelize, Op } = require("sequelize");
const moment = require("moment");
moment().format("yyyy-MM-dd HH:mm:ss");

//Get followers of user
exports.getFollow = async (id, status) => {
  try {
    let ID1 = "";
    let ID2 = "";
    if (status === "followTo") {
      ID1 = "followed_id";
      ID2 = "user_id";
    } else if (status === "followBy") {
      ID1 = "user_id";
      ID2 = "followed_id";
    } else {
      let err = {
        code: "INVALID_INPUT",
        message: "status must be followBy or followTo",
      };
      throw err;
    }
    let result = await db.query(
      `SELECT email, birth, CONCAT(firstname, ' ', lastname) AS name, 
        avatar FROM users WHERE find_in_set(id, (SELECT GROUP_CONCAT(
        DISTINCT t1.${ID1}) FROM user_followers t1 WHERE 
        t1.${ID2} = ${id})) GROUP BY email`,
      { plain: false, type: QueryTypes.SELECT }
    );
    if (Object.keys(result).length === 0) {
      let err = {
        code: "NOT_FOUND",
        message: "Not found any user!",
      };
      throw err;
    }
    return result;
  } catch (err) {
    throw err;
  }
};

// follow/unfollow users
exports.follow = async (user_id, followed_id) => {
  let message;
  try {
    let isUserExists = await checkUserExist(followed_id);
    let alreadyFollowed = await checkFollowerExist(user_id, followed_id);
    if (Number(followed_id) === Number(user_id)) {
      // Condition of not following self
      let err = {
        code: "INVALID_INPUT",
        message: "You cannot follow yourself",
      };
      throw err;
    }
    if (!isUserExists || followed_id.length == 0) {
      // Check if there is an user in database
      let err = {
        code: "NOT_FOUND",
        message: "User not found!",
      };
      throw err;
    }
    if (alreadyFollowed) {
      let message = "Unfollow successfully";
      // Destroy when already follow
      await Followers.destroy({
        where: {
          user_id,
          followed_id,
        },
      });
      return message;
    }
    message = "Follow successfully";
    // Create new follow
    await Followers.create({
      followed_at: Date.now(),
      user_id,
      followed_id,
    });
    return message;
  } catch (err) {
    throw err;
  }
};

// check user exist
const checkUserExist = async (id) => {
  try {
    if (!isNaN(id)) {
      const user = await User.findByPk(id);
      return user;
    }
  } catch (error) {
    throw error;
  }
};

// check follower exist
const checkFollowerExist = async (user_id, followed_id) => {
  try {
    if (!isNaN(user_id) && !isNaN(followed_id)) {
      const like = await Followers.findOne({
        where: {
          user_id,
          followed_id,
        },
      });
      return like;
    }
  } catch (error) {
    throw error;
  }
};

// Search users by name
exports.searchUsers = async (id, name) => {
  try {
    if (!name) {
      return this.profile(id);
    }
    let result = await User.findAll({
      where: {
        name: db.where(
          db.fn("concat", db.col("firstname"), " ", db.col("lastname")),
          {
            [Op.like]: `%${name}%`,
          }
        ),
      },
    });

    if (Object.keys(result).length === 0) {
      let err = {
        code: "NOT_FOUND",
        message: "Not found any user!",
      };
      throw err;
    }

    const data = [];
    for (let index = 0; index < result.length; index++) {
      data.push({
        email: result[index].email,
        birth: formatDateTime(result[index].birth),
        firstname: result[index].firstname,
        lastname: result[index].lastname,
        avatar: result[index].avatar,
      });
    }

    return data;
  } catch (err) {
    throw err;
  }
};

// Search image
exports.getImageBy = async (caption, user, startDate, endDate) => {
  try {
    let captionCondition = { caption: { [Op.like]: "%" + caption + "%" } };
    let userCondition = {
      name: db.where(
        db.fn("concat", db.col("firstname"), " ", db.col("lastname")),
        {
          [Op.like]: "%" + user + "%",
        }
      ),
    };
    let dateCondition = { created_at: { [Op.between]: [startDate, endDate] } };

    let whereClause;

    if (!startDate && !endDate) {
      if (!caption && !user) {
        whereClause = {};
      } else if (caption && !user) {
        whereClause = captionCondition;
      } else if (user && !caption) {
        whereClause = userCondition;
      } else if (caption && user) {
        whereClause = Object.assign({}, userCondition, captionCondition);
      }
    }

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        let err = {
          code: "INVALID_INPUT",
          message: "You must input start date and end date",
        };
        throw err;
      }
      if (startDate && endDate) {
        if (!isDateTime(startDate) || !isDateTime(endDate)) {
          let err = {
            code: "INCORRECT_DATATYPE",
            message: "Input date time is incorrect format",
          };
          throw err;
        }

        var fdate = new Date(startDate);
        var tdate = new Date(endDate);

        if (fdate.valueOf() > tdate.valueOf()) {
          let err = {
            code: "INVALID_INPUT",
            message: "End date must be greater than or equal to start date",
          };
          throw err;
        }
        if (!caption && !user) {
          whereClause = dateCondition;
        } else if (!caption) {
          whereClause = Object.assign({}, userCondition, dateCondition);
        } else if (!user) {
          whereClause = Object.assign({}, captionCondition, dateCondition);
        } else
          whereClause = Object.assign(
            {},
            userCondition,
            captionCondition,
            dateCondition
          );
      }
    }

    let result = await Post.findAll({
      attributes: ["caption", "created_at"],
      include: [
        {
          model: User,
          required: true,
          attributes: [
            "email",
            [
              db.fn("concat", db.col("firstname"), " ", db.col("lastname")),
              "name",
            ],
          ],
        },
        {
          model: Image,
          required: true,
          attributes: ["id", "image_path", "downsize", "thumbnail", "metadata"],
        },
      ],
      where: whereClause,
    });

    if (Object.keys(result).length === 0) {
      let err = {
        code: "NOT_FOUND",
        message: "Not found any image!",
      };
      throw err;
    }

    const data = [];
    for (let index = 0; index < result.length; index++) {
      data.push({
        user: result[index].user,
        caption: result[index].caption,
        created_at: formatDateTime(result[index].created_at),
        images: result[index].images,
      });
    }
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const formatDateTime = function (date) {
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
};

//Kiểm tra chuỗi nhập vào
const isEmpty = function (value) {
  if (!value || 0 === value.length) {
    return true;
  }
};

//Kiểm tra datetime
const isDateTime = function (value) {
  let filterDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  let filterDateTime =
    /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/;
  if (filterDate.test(value) || filterDateTime.test(value)) {
    return true;
  } else {
    return false;
  }
};

//Kiểm tra email
const isEmail = function (value) {
  let filter =
    /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if (filter.test(value)) {
    return true;
  } else {
    return false;
  }
};

//Đăng ký
exports.signUp = async function (users) {
  if (
    isEmpty(users.email) ||
    isEmpty(users.password) ||
    isEmpty(users.firstname) ||
    isEmpty(users.lastname)
  ) {
    let err = {
      code: "INVALID_INPUT",
      message: "Email, password, firstname, lastname can not blank",
    };
    throw err;
  }

  // Kiểm tra định dạng email
  if (!isEmail(users.email)) {
    let err = {
      code: "DATATYPE_ERROR",
      message: "Email is incorrect format",
    };
    throw err;
  }

  // Kiểm tra email đã tồn tại hay chưa, chưa có thì throw lỗi
  let checkEmail = await User.findOne({ where: { email: users.email } });
  if (checkEmail != null) {
    let err = {
      code: "ER_DUP_ENTRY",
      message: "Email must be unique",
    };
    throw err;
  }

  // Kiểm tra định dạng ngày tháng
  if (!isDateTime(users.birth)) {
    let err = {
      code: "INCORRECT_DATATYPE",
      message: "Date of birth is incorrect format",
    };
    throw err;
  }
  const hashPass = bcrypt.hashSync(users.password, 10);
  users.password = hashPass;
  var result = await User.create(users);
  return result;
};

// Tạo token khi đăng nhập
exports.generateToken = async (users, secretSignature) => {
  try {
    //Kiểm tra dữ liệu nhập vào có trống hay không
    if (isEmpty(users.email) || isEmpty(users.password)) {
      let err = {
        code: "INVALID_INPUT",
        message: "Email and password can not blank",
      };
      throw err;
    }
    // Kiểm tra tài khoản có tồn tại hay không, nếu không thì in ra lỗi
    let checkUser = await User.findOne({ where: { email: users.email } });
    if (checkUser === null) {
      let err = {
        code: "NOT_FOUND",
        message: "Can not found user",
      };
      throw err;
    }
    //Kiểm tra mật khẩu chính xác hay không
    let isPassValid = bcrypt.compareSync(users.password, checkUser.password);
    if (!isPassValid) {
      let err = {
        code: "INCORRECT_PASSWORD",
        message: "Password is incorrect",
      };
      throw err;
    }
    const payload = {
      idUser: checkUser.id,
      email: checkUser.email,
    };
    return jwt.sign(
      {
        payload,
      },
      secretSignature,
      {
        algorithm: "HS256",
      }
    );
  } catch (error) {
    throw error;
  }
};

//Lấy thông tin user
exports.profile = async (id) => {
  try {
    let result = await User.findOne({ where: { id: id } });
    return (data = {
      email: result.email,
      birth: result.birth,
      firstname: result.firstname,
      lastname: result.lastname,
      avatar: result.avatar,
    });
  } catch (err) {
    throw err;
  }
};

//Xem thông tin user
exports.userProfile = async (email) => {
  try {
    let result = await User.findOne({ where: { email: email } });
    return (data = {
      firstname: result.firstname,
      lastname: result.lastname,
      birth: result.birth,
      avatar: result.avatar,
    });
  } catch (err) {
    throw error;
  }
};

//Update thông tin user
exports.updateUser = async (email, user) => {
  try {
    let birth = new Date(user.birth);
    if (!isEmpty(user.birth) && !isDateTime(user.birth)) {
      let err = {
        code: "Error",
        message: "Datatype of birth is incorrect",
      };
      throw err;
    }
    await User.update(user, { where: { email: email } });
  } catch (err) {
    throw error;
  }
};

//Update avatar
exports.updateAvatar = async (email, avatar) => {
  try {
    await User.update(avatar, { where: { email: email } });
  } catch (err) {
    throw error;
  }
};

//Xóa avatar
exports.deleteAvatar = async (email) => {
  try {
    let result = await User.findOne({ where: { email: email } });
    if (isEmpty(result.avatar)) {
      let err = {
        code: "Error",
        message: "This user does not have an avatar",
      };
      throw err;
    }
    let values = { avatar: null };
    await User.update(values, { where: { email: email } });
  } catch (err) {
    throw error;
  }
};
