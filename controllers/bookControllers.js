const db = require("../models/db");
const { log } = require("../controllers/updatesheet");
const { sendEmail } = require("../send_mail/mail_sending");

function getChangedFields(before = {}, after = {}) {
  const changes = [];
  for (const key in after) {
    if (after[key] !== before[key] && key !== "createdAt") {
      changes.push(`${key}: '${before[key]}' → '${after[key]}'`);
    }
  }
  return changes;
}

exports.createObject = async (req, res) => {
  const { typeOb, data, id_member } = req.body;
  console.log(req.body);

  if (!typeOb || !data) {
    return res.status(400).json({ message: "Missing typeOb or data" });
  }

  const tableConfig = {
    product: {
      tableName: "products",
      idField: "id_product",
      needCheckID: true,
    },
    receipt: {
      tableName: "receipts",
      idField: "id_receipt",
      needCheckID: false,
    },
    member: { tableName: "members", idField: "id_member", needCheckID: true },
    consignor: {
      tableName: "consignors",
      idField: "id_consignor",
      needCheckID: true,
    },
  };

  const config = tableConfig[typeOb];
  if (!config) {
    return res.status(400).json({ message: "Invalid typeOb" });
  }

  const { tableName, idField, needCheckID } = config;

  if (needCheckID && !data[idField]) {
    return res.status(400).json({ message: `Missing ${idField}` });
  }

  try {
    if (!needCheckID) {
      for (let order of data.order) {
        const [check_order] = await db
          .promise()
          .query("SELECT * FROM products WHERE id_product = ?", [
            order.id_product,
          ]);

        if (check_order[0].stock - order.quantity < 0) {
          console.log("Book unavailable");
          return res
            .status(400)
            .json({ success: false, message: "Book unavailable" });
        }
      }

      await db
        .promise()
        .query("INSERT INTO count_id_receipt (id_member) VALUES (?)", [
          data.receipt.id_member,
        ]);

      const [rows] = await db
        .promise()
        .query(
          "SELECT id FROM count_id_receipt WHERE id_member = ? ORDER BY id DESC LIMIT 1",
          [data.receipt.id_member]
        );

      const id_receipt = data.receipt.id_member + "_" + String(rows[0].id);
      data.receipt.id_receipt = id_receipt;

      const receiptData = data.receipt;

      for (let i = 0; i < data.order.length; i++) {
        data.order[i].id_receipt = id_receipt;
      }
      const orderDataList = data.order;

      console.log("Receipt Data:", receiptData);
      console.log("Order Data List:", orderDataList);

      // Lấy tên thu ngân từ bảng members
      const [memberResult] = await db
        .promise()
        .query("SELECT name FROM members WHERE id_member = ?", [
          receiptData.id_member,
        ]);

      if (memberResult.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy thành viên." });
      }

      const newReceipt = {
        id_receipt: receiptData.id_receipt,
        id_member: receiptData.id_member,
        name_cashier: memberResult[0].name,
        payment_method: receiptData.method_payment,
        total_amount: receiptData.total_amount,
        voucher: receiptData.voucher || 0,
      };

      // Chèn hóa đơn
      await db.promise().query("INSERT INTO receipts SET ?", newReceipt);

      // Chèn đơn hàng
      await Promise.all(
        orderDataList.map((order) => {
          const newOrder = {
            id_receipt: order.id_receipt,
            id_product: order.id_product,
            quantity: order.quantity,
            price: order.price,
          };
          return db.promise().query("INSERT INTO orders SET ?", newOrder);
        })
      );

      // Lấy lại hóa đơn & đơn hàng sau khi insert
      const [receiptResult] = await db
        .promise()
        .query("SELECT * FROM receipts WHERE id_receipt = ?", [
          receiptData.id_receipt,
        ]);
      const [ordersResult] = await db
        .promise()
        .query("SELECT * FROM orders WHERE id_receipt = ?", [
          receiptData.id_receipt,
        ]);
      for (let order of ordersResult) {
        const [productResult] = await db
          .promise()
          .query("SELECT * FROM products WHERE id_product = ?", [
            order.id_product,
          ]);
        order.name = productResult[0].name;
      }

      const receipt = receiptResult[0];
      log(
        `-> Thu ngân thêm hóa đơn. Tổng đơn hàng có giá: ${receipt.total_amount}`,
        `id_cashier: ${receiptData.id_member}`
      );

      return res.status(201).json({
        success: true,
        message: "Create success!",
        receipt: receipt,
        orders: ordersResult,
      });
    }

    const [checkResults] = await db
      .promise()
      .query(
        `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${idField} = ?`,
        [data[idField]]
      );

    if (checkResults[0].count > 0) {
      return res
        .status(200)
        .json({ success: false, message: `${idField} already exists` });
    }

    if (typeOb === "product") {
      data.stock = data.quantity;
    }

    const [insertResults] = await db
      .promise()
      .query(`INSERT INTO ${tableName} SET ?`, [data]);

    res.status(201).json({
      success: true,
      message: "Create success!",
      id: insertResults.insertId,
    });
    log(
      "-> Member thêm " + typeOb + " tên :" + data.name,
      "id_member: " + id_member
    );
  } catch (error) {
    console.error("Lỗi:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.readAllObjects = async (req, res) => {
  try {
    const { typeOb } = req.query;
    if (!typeOb) return res.status(400).json({ message: "Missing typeOb" });

    let query;
    switch (typeOb) {
      case "product":
        query = "SELECT * FROM products";
        break;
      case "receipt":
        query = "SELECT * FROM receipts";
        break;
      case "member":
        query = "SELECT * FROM members";
        break;
      case "consignor":
        query = "SELECT * FROM consignors";
        break;
      default:
        return res.status(400).json({ message: "Invalid typeOb" });
    }

    const [results] = await db.promise().query(query);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.readObjectById = async (req, res) => {
  const { typeUser, typeOb, id } = req.query;
  console.log(
    "Request Params - typeOb:",
    typeOb,
    "id:",
    id,
    "typeUser:",
    typeUser
  );

  if (!typeOb || !id || !typeUser)
    return res
      .status(400)
      .json({ message: "Missing typeOb or ID or typeUser" });
  const validTables = {
    product: "id_product",
    receipt: "id_receipt",
    member: "id_member",
    consignor: "id_consignor",
  };
  const tableConfig = {
    product: "products",
    receipt: "receipts",
    member: "members",
    consignor: "consignors",
  };

  const query = `SELECT * FROM ${tableConfig[typeOb]} WHERE ${validTables[typeUser]} = ?`;
  console.log("SQL Query:", query);

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results);
    res.status(200).json({ success: true, data: results });
  });
};

exports.updateObject = async (req, res) => {
  const { typeOb, id, data, id_member } = req.body;

  if (!typeOb || !id || !data) {
    return res.status(400).json({ message: "Missing typeOb, ID or data" });
  }

  let query, previousData, table, idField;
  switch (typeOb) {
    case "product":
      table = "products";
      idField = "id_product";
      break;
    case "receipt":
      table = "receipts";
      idField = "id_bill";
      break;
    case "member":
      table = "members";
      idField = "id_member";
      break;
    case "consignor":
      table = "consignors";
      idField = "id_consignor";
      break;
    default:
      return res.status(400).json({ message: "Invalid typeOb" });
  }

  query = `UPDATE ${table} SET ? WHERE ${idField} = ?`;
  previousData = `SELECT * FROM ${table} WHERE ${idField} = ?`;

  db.query(previousData, [id], (err, re) => {
    if (err) return res.status(500).send(err.message);
    const before = re[0];

    db.query(query, [data, id], (err, results) => {
      if (err) return res.status(500).send(err.message);

      db.query(
        `SELECT * FROM ${table} WHERE ${idField} = ?`,
        [id],
        (err, now) => {
          if (err) return res.status(500).send(err.message);
          const after = now[0];

          res
            .status(200)
            .json({ success: true, message: "Updated successfully" });

          const changedFields = getChangedFields(before, after);

          if (!data.validate && changedFields.length > 0) {
            const message =
              `→ Cập nhật ${typeOb} với id: ${id}\n` + changedFields.join("\n");
            log(message, "id_member: " + id_member);
          } else if (data.validate) {
            log(
              "-> Sách có id: " +
                id +
                " đã được xác thực bởi BTC có id: " +
                data.id_validate,
              "id_member: " + data.id_validate
            );
          }
        }
      );
    });
  });
};

exports.deleteObject = (req, res) => {
  const { typeOb, id, id_member } = req.query;
  if (!typeOb || !id) {
    return res
      .status(400)
      .json({ message: "Missing typeOb or id or id_member" });
  }

  console.log("Request Params - typeOb:", typeOb, "ID:", id);

  if (typeOb === "product") {
    db.query("DELETE FROM products WHERE id_product = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
      log("-> Đã xóa product với id_product:" + id, "id_member: " + id_member);
    });
    return;
  }

  if (typeOb === "receipt") {
    db.query(
      "DELETE FROM receipts WHERE id_receipt = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        log(
          "-> Đã xóa receipt với id_receipt:" + id,
          "id_member: " + id_member
        );
        res
          .status(200)
          .json({ success: true, message: "Order deleted successfully" });
      }
    );
    return;
  }

  if (typeOb === "member") {
    db.query(
      "SELECT id_consignor FROM consignors WHERE id_member = ?",
      [id],
      (err, consignors) => {
        if (err) return res.status(500).json({ error: err.message });

        const consignorIds = consignors.map((c) => c.id_consignor);
        if (consignorIds.length > 0) {
          db.query(
            "DELETE FROM products WHERE id_consignor IN (?)",
            [consignorIds],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              db.query(
                "DELETE FROM consignors WHERE id_member = ?",
                [id],
                (err) => {
                  if (err) return res.status(500).json({ error: err.message });

                  db.query(
                    "DELETE FROM members WHERE id_member = ?",
                    [id],
                    (err) => {
                      if (err)
                        return res.status(500).json({ error: err.message });

                      res.status(200).json({
                        success: true,
                        message:
                          "Member deleted successfully along with related consignors and products",
                      });
                      log(
                        "-> Đã xóa member với id_member:" + id,
                        "id_member: " + id_member
                      );
                    }
                  );
                }
              );
            }
          );
        } else {
          db.query("DELETE FROM members WHERE id_member = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(200).json({
              success: true,
              message: "Member deleted successfully",
            });
            log(
              "-> Đã xóa member với id_member:" + id,
              "id_member: " + id_member
            );
          });
        }
      }
    );
    return;
  }

  if (typeOb === "consignor") {
    db.query("DELETE FROM products WHERE id_consignor = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(
        "DELETE FROM consignors WHERE id_consignor = ?",
        [id],
        (err, results) => {
          if (err) return res.status(500).json({ error: err.message });

          res.status(200).json({
            success: true,
            message: "Consignor and related products deleted successfully",
          });
          log(
            "-> Đã xóa consignor với id_consignor:" + id,
            "id_member: " + id_member
          );
        }
      );
    });
    return;
  }

  res.status(400).json({ error: "Invalid typeOb" });
};

exports.searchObject = async (req, res) => {
  const { typeOb, query, id_member } = req.query;
  console.log(
    "Search Params - typeOb:",
    typeOb,
    "query:",
    query,
    "id_member:",
    id_member
  );

  if (!typeOb || !query || !id_member)
    return res
      .status(400)
      .json({ message: "Missing typeOb, query, or id_member" });

  let searchQuery = `%${query}%`;
  let sql;

  switch (typeOb) {
    case "product":
      sql =
        "SELECT * FROM products WHERE name_product LIKE ? AND id_member = ?";
      break;
    case "member":
      sql = "SELECT * FROM members WHERE name_member LIKE ? AND id_member = ?";
      break;
    case "consignor":
      sql =
        "SELECT * FROM consignors WHERE name_consignor LIKE ? AND id_member = ?";
      break;
    case "order":
      sql = "SELECT * FROM orders WHERE id_bill LIKE ? AND id_member = ?";
      break;
    default:
      return res.status(400).json({ message: "Invalid typeOb" });
  }

  console.log("SQL Query:", sql);

  db.query(sql, [searchQuery, id_member], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results);
    res.status(200).json({ success: true, data: results });
  });
};

exports.login = async (req, res) => {
  const { id_member, password } = req.body;
  if (!id_member || !password)
    return res.status(400).json({ message: "Missing id_member or password" });

  const sql = "SELECT * FROM members WHERE id_member = ? AND password = ?";

  console.log("SQL Query:", sql);
  console.log("Login Params - id_member:", id_member, "password:", password);

  db.query(sql, [id_member, password], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Login Results:", results);
    if (results.length === 0)
      return res
        .status(200)
        .json({ success: false, message: "Invalid id_member or password" });
    res.status(200).json({ success: true, data: results });
    log(
      "Đăng nhập thành công " + results[0].role + " tên " + results[0].name,
      "id_member: " + id_member
    );
  });
};

// exports.getdetails = (req, res) => {
//   console.log(req.query);
//   const { typeOb, id } = req.query;

//   if (!typeOb || !id) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing typeOb or id" });
//   }

//   const validTables = ["member", "consignor", "product", "receipt"];

//   if (!validTables.includes(typeOb)) {
//     return res.status(400).json({ success: false, message: "Invalid typeOb" });
//   }
//   if (typeOb === "receipt") {
//   }
//   const sql = `SELECT * FROM ${typeOb}s WHERE id_${typeOb} = ?`;

//   console.log("SQL Query:", sql);

//   db.query(sql, [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ success: false, message: err.message });
//     }

//     if (results.length === 0) {
//       return res.status(200).json({ success: false, data: {} });
//     }

//     res.status(200).json({ success: true, data: results[0] });
//   });
// };
exports.getdetails = async (req, res) => {
  console.log(req.query);
  const { typeOb, id } = req.query;

  if (!typeOb || !id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing typeOb or id" });
  }

  const validTables = ["member", "consignor", "product", "receipt"];

  if (!validTables.includes(typeOb)) {
    return res.status(400).json({ success: false, message: "Invalid typeOb" });
  }

  let responseData = {
    receipt: null,
    order: [],
  };

  try {
    if (typeOb !== "receipt") {
      const sql = `SELECT * FROM ${typeOb}s WHERE id_${typeOb} = ?`;

      console.log("SQL Query:", sql);

      const [results] = await db.promise().query(sql, [id]);

      if (results.length === 0) {
        return res.status(200).json({ success: false, data: {} });
      }
      return res.status(200).json({ success: true, data: results[0] });
    } else {
      const receiptQuery = `SELECT * FROM ${typeOb}s WHERE id_${typeOb} = ?`;
      const orderQuery = `SELECT * FROM orders WHERE id_${typeOb} = ?`;

      const [receiptResults] = await db.promise().query(receiptQuery, [id]);

      if (receiptResults.length === 0) {
        return res.status(200).json({ success: false, data: {} });
      }

      responseData.receipt = receiptResults[0];

      const [orderResults] = await db.promise().query(orderQuery, [id]);

      const productPromises = orderResults.map(async (order) => {
        const [productResults] = await db
          .promise()
          .query(`SELECT * FROM products WHERE id_product = ?`, [
            order.id_product,
          ]);
        return productResults[0];
      });

      responseData.orders = await Promise.all(productPromises);

      res.status(200).json({
        success: true,
        receipt: responseData.receipt,
        orders: responseData.orders,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.cronjob = (req, res) => {
  res.status(200).json({ success: true, message: "Cron job executed" });
};

exports.getOrderList = async (req, res) => {
  try {
    const sql = `SELECT * FROM orders`;
    const [results] = await db.promise().query(sql);
    for (book of results) {
      const [productResult] = await db
        .promise()
        .query("SELECT * FROM products WHERE id_product = ?", [
          book.id_product,
        ]);
      book.name = productResult[0].name;
      book.total = book.quantity * book.price;
      book.classify = productResult[0].classify;
    }
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.OrderStatistics = async (req, res) => {
  try {
    // ✅ Khai báo biến tổng
    let [data] = {};
    const [memberResult] = await db
      .promise()
      .query("SELECT id_member FROM members");

    for (const member of memberResult) {
      let KG = 0,
        QG = 0,
        TK = 0,
        TotalReceipt = 0,
        totalvoucher = 0,
        cash = 0,
        banking = 0,
        totalMoney = 0;
      const [receipts] = await db
        .promise()
        .query("SELECT id_receipt FROM receipts WHERE id_member = ?", [
          member.id_member,
        ]);
      TotalReceipt += receipts.length;
      for (const receipt of receipts) {
        totalMoney += receipt.total_amount || 0;
        totalvoucher += receipt.voucher || 0;
        if (receipt.method_payment === "cash") {
          cash += receipt.total_amount || 0;
        } else {
          banking += receipt.total_amount || 0;
        }
        const [orders] = await db
          .promise()
          .query(
            "SELECT id_product, quantity, price FROM orders WHERE id_receipt = ?",
            [receipt.id_receipt]
          );

        for (const order of orders) {
          const [productRows] = await db
            .promise()
            .query("SELECT classify FROM products WHERE id_product = ?", [
              order.id_product,
            ]);
          const classify = productRows[0]?.classify;

          if (classify === "Sách Ký Gửi") {
            KG += order.quantity * order.price;
          } else if (classify === "Sách quyên góp") {
            QG += order.quantity * order.price;
          } else if (classify === "Bán Kg") {
            TK += order.quantity * order.price;
          }
          // Log book data for debugging

          console.log("Book Data:", classify, order.quantity, order.price);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalReceipt: TotalReceipt,
        totalMoney: totalMoney,
        totalVoucher: totalvoucher,
        totalCash: cash,
        totalBanking: banking,
        totalKG: KG,
        totalQG: QG,
        totalTK: TK,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.OrderStatisticsByCashier = async (req, res) => {
  const { id_member } = req.query;
  try {
    let KG = 0,
      QG = 0,
      TK = 0,
      TotalReceipt = 0,
      totalvoucher = 0,
      cash = 0,
      banking = 0,
      totalMoney = 0; // ✅ Khai báo biến tổng
    if (!id_member) {
      return res
        .status(400)
        .json({ success: false, message: "Missing id_member" });
    }
    const [receipts] = await db
      .promise()
      .query("SELECT id_receipt FROM receipts WHERE id_member = ?", [
        id_member,
      ]);
    TotalReceipt += receipts.length;
    for (const receipt of receipts) {
      totalMoney += receipt.total_amount || 0;
      totalvoucher += receipt.voucher || 0;
      if (receipt.method_payment === "cash") {
        cash += receipt.total_amount || 0;
      } else {
        banking += receipt.total_amount || 0;
      }
      const [orders] = await db
        .promise()
        .query(
          "SELECT id_product, quantity, price FROM orders WHERE id_receipt = ?",
          [receipt.id_receipt]
        );

      for (const order of orders) {
        const [productRows] = await db
          .promise()
          .query("SELECT classify FROM products WHERE id_product = ?", [
            order.id_product,
          ]);
        const classify = productRows[0]?.classify;

        if (classify === "Sách Ký Gửi") {
          KG += order.quantity * order.price;
        } else if (classify === "Sách quyên góp") {
          QG += order.quantity * order.price;
        } else if (classify === "Bán Kg") {
          TK += order.quantity * order.price;
        }

        console.log("Book Data:", classify, order.quantity, order.price);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id_member: id_member,
        totalReceipt: TotalReceipt,
        totalMoney: totalMoney,
        totalVoucher: totalvoucher,
        totalCash: cash,
        totalBanking: banking,
        totalKG: KG,
        totalQG: QG,
        totalTK: TK,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.registerClient = async (req, res) => {
  const { attender_name, email, programs } = req.body;
  let state = "old";
  if (!attender_name || !email || !programs) {
    return res.status(400).json({
      message: "Missing attender_name, email or programs_id",
    });
  }
  try {
    const [checkrows] = await db
      .promise()
      .query("SELECT attender_id FROM attender WHERE email = ?", [email]);

    let attender_id = checkrows[0]?.attender_id || null;

    if (attender_id === null) {
      console.log("New attender registration");
      state = "new";
      await db
        .promise()
        .query("INSERT INTO count_id_attender (req) VALUES (?)", [1]);
      const [rows] = await db
        .promise()
        .query("SELECT id FROM count_id_attender ORDER BY id DESC LIMIT 1");
      if (rows[0]?.id < 10) {
        attender_id = "at_000" + rows[0]?.id.toString();
      } else if (rows[0]?.id < 100) {
        attender_id = "at_00" + rows[0]?.id.toString();
      } else if (rows[0]?.id < 1000) {
        attender_id = "at_0" + rows[0]?.id.toString();
      } else {
        attender_id = "at_" + rows[0]?.id.toString();
      }
      await db
        .promise()
        .query(
          "INSERT INTO attender (attender_id, attender_name, email) VALUES (?, ?, ?)",
          [attender_id, attender_name, email]
        );
    } else {
      console.log("Old attender registration");
      await db
        .promise()
        .query("DELETE FROM attendance WHERE attender_id = ?", [attender_id]);
    }
    for (program of programs) {
      await db
        .promise()
        .query(
          "INSERT INTO attendance (attender_id, program_id) VALUES (?, ?)",
          [attender_id, program.program_id]
        );
    }
    // Gửi email xác nhận đăng ký
    if (state === "new") {
      const subject = "Registration Confirmation";
      const text = `Thanks ${attender_name} for registering for the event!`;
      const html = `
  <h3>Xin chào!</h3>
  <p>Dưới đây là mã QR của bạn:</p>
  <img src="https://api.qrserver.com/v1/create-qr-code/?data=${attender_id}&size=200x200" alt="QR Code" />
`;
      await sendEmail({ to: email, subject, text, html: html });
    }
    return res.status(201).json({
      success: true,
      message: "Attender registered successfully",
      attender_id: attender_id,
      state: state,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listRegister = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM attender");
    if (rows.length === 0) {
      return res.status(404).json({ message: "Attender not found" });
    }
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
