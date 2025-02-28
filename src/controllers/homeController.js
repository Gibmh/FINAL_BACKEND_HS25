import db from "../models/index";
import CRUDService from "../services/CRUDService";

let ReadData = async (req, res) => {
  let data = await CRUDService.readAllinfo(req.query);
  console.log(req.query);
  return res.json(data);
};

let CreateData = async (req, res) => {
  let data = await CRUDService.NewObject(req.body);
  return res.json({
    status: true,
  });
};

let ReadID = async (req, res) => {
  console.log(req.query);
  let data = await CRUDService.getInfobyId(req.query);
  return res.json(data);
};

let UpdateData = async (req, res) => {
  let data = await CRUDService.updateObject(req.body);
  return res.json(data);
};

let DeleteData = async (req, res) => {
  let data = await CRUDService.deleteOb(req.query);
  return res.json(data);
};

let Login = async (req, res) => {
  let data = await CRUDService.LoginCheck(req.body);
  return res.json(data);
};

module.exports = {
  UpdateData: UpdateData,
  ReadData: ReadData,
  CreateData: CreateData,
  ReadID: ReadID,
  DeleteData: DeleteData,
  Login: Login,
};
