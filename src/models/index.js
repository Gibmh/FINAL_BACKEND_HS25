"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development"; // Đảm bảo sử dụng NODE_ENV nếu có
const db = {};

require("dotenv").config(); // Đảm bảo rằng dotenv được cấu hình để đọc từ .env file

let sequelize;
const dbConfig = {
  host: process.env.HOST, // lấy host từ biến môi trường
  dialect: process.env.DIALECT || "mysql", // lấy dialect từ biến môi trường (mặc định mysql)
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

if (process.env.DB_USE_ENV_VARIABLE) {
  sequelize = new Sequelize(
    process.env[process.env.DB_USE_ENV_VARIABLE],
    dbConfig
  );
} else {
  sequelize = new Sequelize(
    process.env.DB, // Lấy tên cơ sở dữ liệu từ env
    process.env.USER, // Lấy username từ env
    process.env.PASS, // Lấy mật khẩu từ env
    dbConfig
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
