const db = require("../db/config");
const User = require("./user");
const {Sequelize, DataTypes, Deferrable} = require("sequelize");

const Follower = db.define(
    "user_followers",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        followed_at: {
            type: DataTypes.DATE,
            allowNull: false,
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
        followed_id: {
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
        timestamps: false,
        underscored: true,
        index: [
            {
                name: "index_follower1",
                fields: ["user_id"],
            },
            {
                name: "index_follower2",
                fields: ["followed_id"],
            },
        ],
    }
);

User.hasMany(Follower, {foreignKey: "user_id"});
Follower.belongsTo(User, {foreignKey: "followed_id"});
User.hasMany(Follower, {foreignKey: "followed_id"});
Follower.belongsTo(User);
db.sync();
module.exports = Follower;
