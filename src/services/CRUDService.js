import db from "../models/index";
const { Op } = require("sequelize");

const NewObject = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received data.typeOb:", data.typeOb);
      if (!data.typeOb) throw new Error("Missing or invalid typeOb");

      switch (data.typeOb) {
        case "book":
          await db.products.create(data);
          break;
        case "order":
          await db.orders.create(data);
          break;
        case "member":
          await db.members.create(data);
          break;
        case "consignor":
          await db.consignors.create(data);
          break;
        default:
          throw new Error("Invalid typeOb");
      }

      resolve({ success: true, message: "Create success!" });
    } catch (error) {
      console.error("Error in NewObject:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

const readAllinfo = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received data.typeOb:", data.typeOb);
      if (!data.typeOb) throw new Error("Missing or invalid typeOb");

      let data_res;
      switch (data.typeOb) {
        case "book":
          data_res = await db.products.findAll({ raw: true });
          break;
        case "order":
          data_res = await db.orders.findAll({ raw: true });
          break;
        case "member":
          data_res = await db.members.findAll({ raw: true });
          break;
        case "consignor":
          data_res = await db.consignors.findAll({ raw: true });
          break;
        default:
          throw new Error("Invalid typeOb");
      }

      resolve({ success: true, data: data_res });
    } catch (error) {
      console.error("Error in readAllinfo:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

const getInfobyId = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received data.typeOb:", data.typeOb);
      if (!data.typeOb || !data.ID) throw new Error("Missing typeOb or ID");

      let data_res;
      switch (data.typeOb) {
        case "book":
          data_res = await db.products.findOne({
            where: { id_product: data.ID },
            raw: true,
          });
          break;
        case "order":
          data_res = await db.orders.findOne({
            where: { id_bill: data.ID },
            raw: true,
          });
          break;
        case "member":
          data_res = await db.members.findOne({
            where: { id_member: data.ID },
            raw: true,
          });
          break;
        case "consignor":
          data_res = await db.consignors.findOne({
            where: { id_consignor: data.ID },
            raw: true,
          });
          break;
        default:
          throw new Error("Invalid typeOb");
      }

      if (data_res) {
        resolve({ success: true, data: data_res });
      } else {
        resolve({ success: false, message: "No record found" });
      }
    } catch (error) {
      console.error("Error in getInfobyId:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

const updateObject = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received data.typeOb:", data.typeOb);
      if (!data.typeOb || !data.id) throw new Error("Missing typeOb or ID");

      let result;
      switch (data.typeOb) {
        case "book":
          result = await db.products.update(data, {
            where: { id_product: data.id },
          });
          break;
        case "order":
          result = await db.orders.update(data, {
            where: { id_bill: data.id },
          });
          break;
        case "member":
          result = await db.members.update(data, {
            where: { id_member: data.id },
          });
          break;
        case "consignor":
          result = await db.consignors.update(data, {
            where: { id_consignor: data.id },
          });
          break;
        default:
          throw new Error("Invalid typeOb");
      }

      if (result[0] > 0) {
        resolve({ success: true, message: "Updated successfully" });
      } else {
        resolve({ success: false, message: "No record found to update" });
      }
    } catch (error) {
      console.error("Error in updateObject:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

const deleteOb = (rq) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received rq.typeOb:", rq.typeOb);
      if (!rq.typeOb || !rq.id) throw new Error("Missing typeOb or ID");

      let result;
      switch (rq.typeOb) {
        case "book":
          result = await db.products.destroy({ where: { id_product: rq.id } });
          break;
        case "order":
          result = await db.orders.destroy({ where: { id_bill: rq.id } });
          break;
        case "member":
          result = await db.members.destroy({ where: { id_member: rq.id } });
          break;
        case "consignor":
          result = await db.consignors.destroy({
            where: { id_consignor: rq.id },
          });
          break;
        default:
          throw new Error("Invalid typeOb");
      }

      if (result > 0) {
        resolve({ success: true, message: "Record deleted successfully" });
      } else {
        resolve({ success: false, message: "No record found to delete" });
      }
    } catch (error) {
      console.error("Error in deleteOb:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

const LoginCheck = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Received data:", data);
      if (!data.id_member || !data.password)
        throw new Error("Missing id_member or password");

      let user = await db.members.findOne({
        where: { id_member: data.id_member },
        raw: true,
      });
      if (user) {
        if (user.password === data.password) {
          resolve({ success: true, data: user });
        } else {
          resolve({ success: false, message: "Incorrect password" });
        }
      } else {
        resolve({ success: false, message: "User not found" });
      }
    } catch (error) {
      console.error("Error in LoginCheck:", error.message);
      reject({ success: false, message: error.message });
    }
  });
};

module.exports = {
  NewObject: NewObject,
  readAllinfo: readAllinfo,
  getInfobyId: getInfobyId,
  updateObject: updateObject,
  deleteOb: deleteOb,
  LoginCheck: LoginCheck,
};
