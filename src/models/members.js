"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class members extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  members.init(
    {
      id_member: DataTypes.STRING,
      password: DataTypes.STRING,
      name: DataTypes.STRING,
      role: DataTypes.STRING,
      total_order: DataTypes.INTEGER,
      revenue: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "members",
    }
  );
  return members;
};
