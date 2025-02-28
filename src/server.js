import express from "express";
import bodyParser from "body-parser";
// import initWebroutes from "./routes/web";
import connectDB from "./config/connectDB";
import cors from "cors";
import {
  ReadData,
  CreateData,
  ReadID,
  UpdateData,
  DeleteData,
  Login,
} from "./controllers/homeController";
require("dotenv").config();

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
connectDB();

app.get(String(process.env.API_GOL), ReadData);
app.post(String(process.env.API_CO), CreateData);
app.get(String(process.env.API_GOBID), ReadID);
app.post(String(process.env.API_UO), UpdateData);
app.delete(String(process.env.API_DO), DeleteData);
app.post(String(process.env.API_LC), Login);

let port = process.env.PORT || 3030;
// port == undifined => port = 3030
app.listen(port, () => {
  console.log("Server listening on port " + port);
});
