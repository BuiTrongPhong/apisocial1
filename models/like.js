const db = require("../db/config");
const User = require("./user");
const Comment = require("./comment");
const {Sequelize, DataTypes, Deferrable} = require("sequelize");

const Like = db.define(
    "likes",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
                deferrable: Deferrable.INITIALLY_IMMEDIATE,
            },
        },
        foreign_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // type 1 as Like Post, type 2 as Like Comment
        type_like: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        index: [
            {
                name: "index_cmt1",
                fields: ["user_id"],
            },
        ],
        timestamps: true,
        underscored: true,
    }
);

Like.belongsTo(Comment, {foreignKey: "user_id"});
User.hasMany(Like, {foreignKey: "user_id"});
Like.belongsTo(User);
db.sync();
module.exports = Like;
