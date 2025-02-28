"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class consignors extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  consignors.init(
    {
      id_consignor: DataTypes.STRING,
      name: DataTypes.STRING,
      id_bank: DataTypes.INTEGER,
      bank_name: DataTypes.STRING,
      holder_name: DataTypes.STRING,
      cash_back: DataTypes.INTEGER,
      id_member: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "consignors",
    }
  );
  return consignors;
};
