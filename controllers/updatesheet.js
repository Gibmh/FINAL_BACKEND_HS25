const moment = require("moment");
const db = require("../models/db");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { GoogleAuth } = require("google-auth-library");
require("dotenv").config();

exports.BookSheet = async () => {
  const format = "HH:mm DD/MM/YYYY";
  let formatedDate = moment(new Date()).format(format);

  console.log("📡 Đang truy vấn MySQL...");

  try {
    // 🔹 Lấy danh sách thành viên từ bảng "members"
    const members = await new Promise((resolve, reject) => {
      db.query("SELECT id_member, name, role FROM members", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!members || members.length === 0) {
      console.warn("⚠ Không có dữ liệu để ghi vào Google Sheets.");
      return res.status(200).json({ message: "Không có dữ liệu để ghi!" });
    }

    console.log(`📋 Đã lấy được ${members.length} thành viên từ MySQL.`);

    // 🔹 Lấy thêm dữ liệu từ consignors & products
    let detailedData = [];

    for (let member of members) {
      let consignors = await new Promise((resolve, reject) => {
        db.query(
          `SELECT id_consignor, name AS consignor_name, id_bank, bank_name, holder_name, createdAt, address 
           FROM consignors WHERE id_member = ?`,
          [member.id_member],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

      for (let consignor of consignors) {
        let products = await new Promise((resolve, reject) => {
          db.query(
            `SELECT id_product, name AS product_name, age, genre, classify, bc_cost, discount, price, 
             cash_back, quantity, sold, stock, createdAt, id_validate 
             FROM products WHERE id_consignor = ?`,
            [consignor.id_consignor],
            (err, rows) => (err ? reject(err) : resolve(rows))
          );
        });

        for (let product of products) {
          detailedData.push({
            Product_ID: "'" + product.id_product,
            Product_Name: product.product_name,
            Age: product.age,
            Genre: product.genre,
            Classify: product.classify,
            Base_Cost: product.bc_cost,
            Discount: product.discount,
            Price: product.price,
            Cashback: product.cash_back,
            Quantity: product.quantity,
            Sold: product.sold,
            Stock: product.stock,
            Product_Created: product.createdAt,
            Validate_ID: "'" + product.id_validate,
            Consignor_ID: "'" + consignor.id_consignor,
            Consignor_Name: consignor.consignor_name,
            Member_ID: "'" + member.id_member,
            Member_Name: member.name,
            Member_Role: member.role,
            Date: "Cập nhật lúc" + formatedDate,
          });
        }
      }
    }

    console.log(`🔍 Đã tổng hợp ${detailedData.length} dòng dữ liệu.`);

    // 🔹 Kết nối Google Sheets
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // 🔹 Xóa dữ liệu cũ và ghi tiêu đề mới
    await doc.sheetsByIndex[0].clear();
    await doc.sheetsByIndex[0].setHeaderRow(Object.keys(detailedData[0]));

    // 🔹 Ghi dữ liệu vào Google Sheets
    await doc.sheetsByIndex[0].addRows(detailedData);

    console.log(`✅ Đã ghi ${detailedData.length} dòng vào Google Sheets!`);
    // return res.status(200).json({
    //   message: `Đã ghi ${detailedData.length} dòng vào Google Sheets!`,
    // });
  } catch (error) {
    console.error("❌ LỖI:", error.message);
    // return res.status(500).json({ error: "Lỗi khi xử lý dữ liệu!" });
  }
};

exports.ConsignorSheet = async () => {
  const format = "HH:mm DD/MM/YYYY";
  let formatedDate = moment(new Date()).format(format);

  console.log("📡 Đang truy vấn MySQL...");

  try {
    // 🔹 Lấy danh sách thành viên từ bảng "members"
    const members = await new Promise((resolve, reject) => {
      db.query("SELECT id_member, name, role FROM members", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!members || members.length === 0) {
      console.warn("⚠ Không có dữ liệu để ghi vào Google Sheets.");
    }

    console.log(`📋 Đã lấy được ${members.length} thành viên từ MySQL.`);

    // 🔹 Lấy thêm dữ liệu từ consignors & products
    let detailedData = [];
    let blacklist = [];

    for (let member of members) {
      let consignors = await new Promise((resolve, reject) => {
        db.query(
          `SELECT * FROM consignors WHERE id_member = ?`,
          [member.id_member],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });
      if (!consignors || consignors.length === 0) {
        console.warn(
          `⚠ Thành viên ${member.name} không có dữ liệu consignors.`
        );
        blacklist.push({
          Member_ID: "'" + member.id_member,
          Member_Name: member.name,
          Role: member.role,
          Reason: "Chưa có người kí gửi",
          Update_Date: "Cập nhật lúc" + formatedDate,
        });
      } else {
        for (let consignor of consignors) {
          let total = await new Promise((resolve, reject) => {
            db.query(
              `SELECT COUNT(*) AS count FROM products WHERE id_consignor = ?`,
              [consignor.id_consignor],
              (err, rows) => (err ? reject(err) : resolve(rows[0]?.count || 0))
            );
          });

          let totalrevenue = await new Promise((resolve, reject) => {
            db.query(
              `SELECT SUM(sold) AS revenue FROM products WHERE id_consignor = ?`,
              [consignor.id_consignor],
              (err, rows) =>
                err ? reject(err) : resolve(rows[0]?.revenue || 0)
            );
          });

          let totalDonated = await new Promise((resolve, reject) => {
            db.query(
              `SELECT COUNT(*) AS donated FROM products WHERE id_consignor = ? AND classify = "Sách Quyên Góp"`,
              [consignor.id_consignor],
              (err, rows) =>
                err ? reject(err) : resolve(rows[0]?.donated || 0)
            );
          });

          let totalConsigned = await new Promise((resolve, reject) => {
            db.query(
              `SELECT COUNT(*) AS consigned FROM products WHERE id_consignor = ? AND classify = "Sách Ký Gửi"`,
              [consignor.id_consignor],
              (err, rows) =>
                err ? reject(err) : resolve(rows[0]?.consigned || 0)
            );
          });

          let getTotalPayment = await new Promise((resolve, reject) => {
            db.query(
              `SELECT SUM(price * sold) AS total_payment FROM products WHERE id_consignor = ? AND sold > 0`, // Chỉ lấy sản phẩm đã bán
              [consignor.id_consignor],
              (err, rows) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(rows[0]?.total_payment || 0);
                }
              }
            );
          });

          if (!total) {
            blacklist.push({
              Member_ID: "'" + member.id_member,
              Member_Name: member.name,
              Role: member.role,
              Reason:
                "Người kí gửi có id: " +
                consignor.id_consignor +
                " không có sách.",
              Update_Date: "Cập nhật lúc" + formatedDate,
            });
          } else {
            detailedData.push({
              Consignor_ID: "'" + consignor.id_consignor,
              Consignor_Name: consignor.name,
              Bank_ID: "'" + consignor.id_bank,
              Bank_Name: consignor.bank_name,
              Holder_Name: consignor.holder_name,
              Consignor_Address: consignor.address,
              Total_Consigned: totalConsigned,
              Total_Donated: totalDonated,
              Total_Product: total,
              Total_Revenue: totalrevenue,
              Cashback: getTotalPayment,
              Member_ID: "'" + member.id_member,
              Member_Name: member.name,
              Role: member.role,
              Date: "Cập nhật lúc" + formatedDate,
            });
          }
        }
      }
    }

    console.log(
      `🔍 Đã tổng hợp ${detailedData.length} dòng dữ liệu đang thực hiện KPI.`
    );
    console.log(
      `🔍 Đã tổng hợp ${blacklist.length} dòng dữ liệu không đạt KPI hoặc có lỗi.`
    );

    // 🔹 Kết nối Google Sheets
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[1];
    //Người có kpi
    await doc.sheetsByIndex[1].clear();
    await doc.sheetsByIndex[1].setHeaderRow(Object.keys(detailedData[0]));
    await doc.sheetsByIndex[1].addRows(detailedData);
    // Người chưa đạt
    await doc.sheetsByIndex[2].clear();
    await doc.sheetsByIndex[2].setHeaderRow(Object.keys(blacklist[0]));
    await doc.sheetsByIndex[2].addRows(blacklist);
    console.log(`✅ Đã ghi ${detailedData.length} dòng vào Google Sheets!`);
    console.log(`✅ Đã ghi ${blacklist.length} dòng vào Google Sheets!`);
  } catch (error) {
    console.error("❌ LỖI:", error.message);
  }
};
