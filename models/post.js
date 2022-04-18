const db = require("../db/config");
const User = require("./user");
const {Sequelize, DataTypes, Deferrable} = require("sequelize");

const Post = db.define(
    "posts",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        caption: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        total_likes: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_comment: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
    },
    {
        index: [
            {
                name: "index_post",
                fields: ["user_id"],
            },
        ],
        timestamps: false,
        underscored: true,
    }
);

User.hasMany(Post, {foreignKey: "user_id"});
Post.belongsTo(User);
db.sync();
module.exports = Post;
