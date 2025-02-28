'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class products extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  products.init({
    id_product: DataTypes.STRING,
    id_consignor: DataTypes.STRING,
    name: DataTypes.STRING,
    age: DataTypes.STRING,
    genre: DataTypes.STRING,
    classify: DataTypes.STRING,
    bc_cost: DataTypes.INTEGER,
    discount: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    cash_back: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    sold: DataTypes.INTEGER,
    stock: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'products',
  });
  return products;
};