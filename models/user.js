const db = require("../db/config");
const {Sequelize, DataTypes, Deferrable, Model} = require("sequelize");

const User = db.define(
    "users",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        birth: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        firstname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: false,
        underscored: true,
    }
);
db.sync();
module.exports = User;
