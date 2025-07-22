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
            Date: "Cập nhật lúc " + formatedDate,
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
  const format = "HH:mm DD/MM/YYYY"; // chỉnh lại đường dẫn đúng

  let formatedDate = moment(new Date()).format(format);

  console.log("📡 Đang truy vấn MySQL...");

  try {
    const members = await new Promise((resolve, reject) => {
      db.query("SELECT id_member, name, role FROM members", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!members || members.length === 0) {
      console.warn("⚠ Không có dữ liệu để ghi vào Google Sheets.");
      //   return res.status(200).json({ message: "Không có thành viên." });
    }

    console.log(`📋 Đã lấy được ${members.length} thành viên từ MySQL.`);

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
          Update_Date: "Cập nhật lúc " + formatedDate,
        });
      } else {
        let totalProducts = 0;
        for (let consignor of consignors) {
          const [
            total,
            totalrevenue,
            totalDonated,
            totalConsigned,
            getTotalPayment,
          ] = await Promise.all([
            new Promise((resolve, reject) => {
              db.query(
                `SELECT COUNT(*) AS count FROM products WHERE id_consignor = ?`,
                [consignor.id_consignor],
                (err, rows) =>
                  err ? reject(err) : resolve(rows[0]?.count || 0)
              );
            }),
            new Promise((resolve, reject) => {
              db.query(
                `SELECT SUM(sold) AS revenue FROM products WHERE id_consignor = ?`,
                [consignor.id_consignor],
                (err, rows) =>
                  err ? reject(err) : resolve(rows[0]?.revenue || 0)
              );
            }),
            new Promise((resolve, reject) => {
              db.query(
                `SELECT COUNT(*) AS donated FROM products WHERE id_consignor = ? AND classify = "Sách Quyên Góp"`,
                [consignor.id_consignor],
                (err, rows) =>
                  err ? reject(err) : resolve(rows[0]?.donated || 0)
              );
            }),
            new Promise((resolve, reject) => {
              db.query(
                `SELECT COUNT(*) AS consigned FROM products WHERE id_consignor = ? AND classify = "Sách Ký Gửi"`,
                [consignor.id_consignor],
                (err, rows) =>
                  err ? reject(err) : resolve(rows[0]?.consigned || 0)
              );
            }),
            new Promise((resolve, reject) => {
              db.query(
                `SELECT SUM(price * sold) AS total_payment FROM products WHERE id_consignor = ? AND sold > 0`,
                [consignor.id_consignor],
                (err, rows) =>
                  err ? reject(err) : resolve(rows[0]?.total_payment || 0)
              );
            }),
          ]);

          if (!total) {
            blacklist.push({
              Member_ID: "'" + member.id_member,
              Member_Name: member.name,
              Role: member.role,
              Reason: `Người kí gửi có id: ${consignor.id_consignor} không có sách.`,
              Update_Date: "Cập nhật lúc " + formatedDate,
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
              Date: "Cập nhật lúc " + formatedDate,
            });
          }
          totalProducts += totalConsigned + totalDonated;
        }

        if (totalProducts < 50) {
          blacklist.push({
            Member_ID: "'" + member.id_member,
            Member_Name: member.name,
            Role: member.role,
            Reason: `Chưa đạt KPI. Số sách hiện tại ${totalProducts} cuốn.`,
            Update_Date: "Cập nhật lúc " + formatedDate,
          });
        }
      }
    }

    console.log(`🔍 Đã tổng hợp ${detailedData.length} dòng dữ liệu KPI.`);
    console.log(
      `🔍 Đã tổng hợp ${blacklist.length} dòng dữ liệu không đạt KPI.`
    );

    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    const kpiSheet = doc.sheetsByIndex[1];
    const failSheet = doc.sheetsByIndex[2];

    await kpiSheet.clear();
    await kpiSheet.setHeaderRow(Object.keys(detailedData[0]));
    await kpiSheet.addRows(detailedData);

    await failSheet.clear();
    await failSheet.setHeaderRow(Object.keys(blacklist[0]));
    await failSheet.addRows(blacklist);

    console.log(
      `✅ Ghi ${detailedData.length} dòng KPI và ${blacklist.length} dòng blacklist.`
    );

    // return res.status(200).json({
    //   message: "Đã cập nhật Google Sheets thành công.",
    //   kpi_count: detailedData.length,
    //   blacklist_count: blacklist.length,
    // });
  } catch (error) {
    console.error("❌ LỖI:", error.message);
    //   return res
    //     .status(500)
    //     .json({ error: "Đã xảy ra lỗi", detail: error.message });
  }
};

exports.log = async (log, id = "") => {
  const format = "HH:mm DD/MM/YYYY";
  let formatedDate = moment(new Date()).format(format);
  let message = {
    Time: "Thực hiện lúc " + formatedDate,
    Action: log,
    Member_ID: "'" + id,
  };
  console.log("📡");
  // 🔹 Kết nối Google Sheets
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo(); //Người có kpi
  await doc.sheetsByIndex[3].setHeaderRow(Object.keys(message));
  await doc.sheetsByIndex[3].addRows([message]);
  console.log(`✅ Đã ghi lại hoạt động vào Google Sheets!`);
};

exports.list_kpi = async () => {
  const format = "HH:mm DD/MM/YYYY";
  let formatedDate = moment(new Date()).format(format);

  console.log("📡 Đang truy vấn MySQL...");

  let detailedDataBTC = [];
  let detailedDataCTV = [];
  try {
    const members = await new Promise((resolve, reject) => {
      db.query("SELECT id_member, name, role FROM members", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    if (!members || members.length === 0) {
      console.warn("⚠ Không có dữ liệu để ghi vào Google Sheets.");
    }
    for (let member of members) {
      if (
        member.id_member.includes("BTC") ||
        member.id_member.includes("QLS")
      ) {
        let count_book = await new Promise((resolve, reject) => {
          db.query(
            "SELECT COUNT(*) as count_book FROM products WHERE id_member = ?",
            [member.id_member],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });
        detailedDataBTC.push({
          ID: member.id_member,
          Tên: member.name,
          "Số sách": count_book[0].count_book,
          "Hoàn thành (%)": (count_book[0].count_book / 50) * 100,
          "Ngày cập nhật": "Cập nhật lúc " + formatedDate,
        });
      } else if (member.id_member.includes("CTV")) {
        let count_book = await new Promise((resolve, reject) => {
          db.query(
            "SELECT COUNT(*) as count_book FROM products WHERE id_member = ?",
            [member.id_member],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });
        detailedDataCTV.push({
          ID: member.id_member,
          Tên: member.name,
          "Số sách": count_book[0].count_book,
          "Hoàn thành (%)": (count_book[0].count_book / 50) * 100,
          "Ngày cập nhật": "Cập nhật lúc " + formatedDate,
        });
      }
    }
    detailedDataBTC[0]["Phần trăm KPI trên tổng KPI"] =
      "=ROUND(SUM('KPI BTC'!C:C)/(5000)*100,2)";
    detailedDataCTV[0]["Phần trăm KPI trên tổng KPI"] =
      "=ROUND(SUM('KPI TV'!C:C)/(5000)*100,2)";
    console.log(`📋 Đã lấy được ${members.length} thành viên từ MySQL.`);
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

    await doc.sheetsByIndex[4].clear();
    await doc.sheetsByIndex[4].setHeaderRow(Object.keys(detailedDataBTC[0]));
    await doc.sheetsByIndex[4].addRows(detailedDataBTC);

    await doc.sheetsByIndex[5].clear();
    await doc.sheetsByIndex[5].setHeaderRow(Object.keys(detailedDataCTV[0]));
    await doc.sheetsByIndex[5].addRows(detailedDataCTV);

    console.log(`✅ Đã ghi vào Google Sheets!`);
    // return res.status(200).json({
    //   message: `Đã ghi  vào Google Sheets!`,
    // });
  } catch (error) {
    console.error("❌ LỖI:", error.message);
    // return res.status(500).json({ error: "Lỗi khi xử lý dữ liệu!" });
  }
};

//
