"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("consignors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_consignor: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      id_bank: {
        type: Sequelize.INTEGER,
      },
      bank_name: {
        type: Sequelize.STRING,
      },
      holder_name: {
        type: Sequelize.STRING,
      },
      cash_back: {
        type: Sequelize.INTEGER,
      },
      id_member: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("consignors");
  },
};
