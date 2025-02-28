const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB,
  process.env.USER,
  process.env.PASS,
  {
    host: process.env.HOST,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 60000,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

let connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Kết nối thành công với cơ sở dữ liệu.");
  } catch (error) {
    console.error("Không thể kết nối với cơ sở dữ liệu:", error.message);
  }
};

module.exports = connectDB;
