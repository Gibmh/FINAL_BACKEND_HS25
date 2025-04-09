const db = require("../models/db");
const { log } = require("../controllers/updatesheet");

function getChangedFields(before = {}, after = {}) {
  const changes = [];
  for (const key in after) {
    if (after[key] !== before[key]) {
      changes.push(`${key}: '${before[key]}' → '${after[key]}'`);
    }
  }
  return changes;
}

exports.createObject = async (req, res) => {
  const { typeOb, data } = req.body;
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
    order: { tableName: "receipts", idField: "id_receipt", needCheckID: false },
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
      const check_receipt = await db
        .promise()
        .query(
          "SELECT COUNT(*) AS count FROM receipts WHERE id_receipt = ?",
          data.receipt.id_receipt
        );
      if (check_receipt[0][0].count > 0) {
        console.log("Receipt already exists");
        return res
          .status(400)
          .json({ success: false, message: "Receipt already exists" });
      }
      // Xử lý dữ liệu hóa đơn
      else {
        const receiptData = data.receipt;
        const orderDataList = data.order;

        console.log("Receipt Data:", receiptData);
        console.log("Order Data List:", orderDataList);

        // Lấy tên thu ngân từ bảng `members`
        const [results] = await db
          .promise()
          .query("SELECT name FROM members WHERE id_member = ?", [
            receiptData.id_member,
          ]);

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Không tìm thấy thành viên." });
        }

        // Tạo dữ liệu hóa đơn
        const newReceipt = {
          id_receipt: receiptData.id_receipt,
          id_member: receiptData.id_member,
          name_cashier: results[0].name,
          payment_method: receiptData.method_payment,
          voucher: !receiptData.voucher ? 0 : receiptData.voucher,
        };

        // Chèn hóa đơn vào bảng `receipts`
        await db.promise().query("INSERT INTO receipts SET ?", newReceipt);

        // Chèn tất cả đơn hàng vào bảng `orders`
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
        const receipt_after_insert = await db
          .promise()
          .query("SELECT * FROM receipts WHERE id_receipt = ?", [
            receiptData.id_receipt,
          ]);
        const orders_after_insert = await db
          .promise()
          .query("SELECT * FROM orders WHERE id_receipt = ?", [
            receiptData.id_receipt,
          ]);
        log(
          "-> Thu ngân thêm hóa đơn." +
            "Tổng đơn hàng có giá : " +
            receipt_after_insert[0][0].total_amount -
            receipt_after_insert[0][0].voucher,
          "id_cachier: " + receiptData.id_member
        );
        receipt_after_insert[0][0].total_amount =
          receipt_after_insert[0][0].total_amount -
          receipt_after_insert[0][0].voucher;

        return res.status(201).json({
          success: true,
          message: "Create success!",
          receipt: receipt_after_insert[0],
          orders: orders_after_insert,
        });
      }
    }

    // Kiểm tra ID đã tồn tại chưa
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

    // Xử lý riêng sản phẩm (set stock = quantity)
    if (typeOb === "product") {
      data.stock = data.quantity;
    }

    // Chèn dữ liệu vào bảng
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
      "id_member: " + data.id_member
    );
  } catch (error) {
    console.error("Lỗi:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.readAllObjects = async (req, res) => {
  const { typeOb } = req.query;
  if (!typeOb) return res.status(400).json({ message: "Missing typeOb" });

  let query;
  switch (typeOb) {
    case "product":
      query = "SELECT * FROM products";
      break;
    case "order":
      query = "SELECT * FROM receipts";
      break;
    case "member":
      query = "SELECT * FROM members";
      break;
    case "consignor":
      query = "SELECT * FROM consignors";
      break;
    default:
      return res
        .status(400)
        .json({ success: false, message: "Invalid typeOb" });
  }

  console.log("SQL Query:", query);

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results);
    res.status(200).json({ success: true, data: results });
  });
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
    order: "id_bill",
    member: "id_member",
    consignor: "id_consignor",
  };

  if (!validTables[typeOb] || !validTables[typeUser]) {
    return res.status(400).json({ message: "Invalid typeOb" });
  }

  const query = `SELECT * FROM ${typeOb}s WHERE ${validTables[typeUser]} = ?`;
  console.log("SQL Query:", query);

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results);
    res.status(200).json({ success: true, data: results });
  });
};

// exports.updateObject = async (req, res) => {
//   const { typeOb, id, data, id_member } = req.body;
//   console.log(req.body);
//   if (!typeOb || !id || !data)
//     return res.status(400).json({ message: "Missing typeOb, ID or data" });

//   let query, previousData;
//   switch (typeOb) {
//     case "product":
//       query = "UPDATE products SET ? WHERE id_product = ?";
//       previousData = "SELECT * FROM products WHERE id_product = ?";
//       break;
//     case "order":
//       query = "UPDATE orders SET ? WHERE id_bill = ?";
//       previousData = "SELECT * FROM orders WHERE id_bill = ?";
//       break;
//     case "member":
//       query = "UPDATE members SET ? WHERE id_member = ?";
//       previousData = "SELECT * FROM members WHERE id_member = ?";
//       break;
//     case "consignor":
//       query = "UPDATE consignors SET ? WHERE id_consignor = ?";
//       previousData = "SELECT * FROM consignors WHERE id_consignor = ?";
//       break;
//     default:
//       return res.status(400).json({ message: "Invalid typeOb" });
//   }

//   console.log("SQL Query:", query);
//   console.log("Data to Update:", data);
//   db.query(previousData, [id], (err, re) => {
//     if (err) return res.status(500).send(err.message);
//     console.log("Previous data:", re);
//     db.query(query, [data, id], (err, results) => {
//       if (err) return res.status(500).send(err.message);
//       console.log("Update Results:", results);
//       res.status(200).json({ success: true, message: "Updated successfully" });
//       db.query(
//         "SELECT * FROM " + typeOb + "s WHERE id_" + typeOb + " = ?",
//         [id],
//         (err, now) => {
//           if (err) return res.status(500).send(err.message);
//           let check = now[0] == re[0];
//           if (!data.validate && !check)
//             log(
//               "-> Cập nhân thông tin của " +
//                 typeOb +
//                 " với id: " +
//                 typeOb +
//                 ": " +
//                 id +
//                 "\nTừ : " +
//                 JSON.stringify(re[0] || {}) +
//                 "\n Thành: " +
//                 JSON.stringify(data || {}),
//               "id_member: " + id_member
//             );
//           else if (data.validate)
//             log(
//               "-> Sách có id: " +
//                 id +
//                 " đã được xác thực bởi BTC có id: " +
//                 data.id_validate,
//               "id_member: " + data.id_validate
//             );
//         }
//       );
//     });
//   });
// };
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
    case "order":
      table = "orders";
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
    db.query(
      "SELECT id_consignor FROM products WHERE id_product = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        const id_consignor = results[0].id_consignor;

        db.query("DELETE FROM products WHERE id_product = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(200).json({
            success: true,
            message: "Product deleted successfully",
          });
          log(
            "-> Đã xóa product với id_product:" + id,
            "id_member: " + id_member
          );
        });
      }
    );

    return;
  }

  if (typeOb === "order") {
    db.query(
      "DELETE FROM receipts WHERE id_receipt = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
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

exports.getdetails = (req, res) => {
  console.log(req.query);
  const { typeOb, id } = req.query;

  if (!typeOb || !id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing typeOb or id" });
  }

  const validTables = ["member", "consignor", "product"];

  if (!validTables.includes(typeOb)) {
    return res.status(400).json({ success: false, message: "Invalid typeOb" });
  }

  const sql = `SELECT * FROM ${typeOb}s WHERE id_${typeOb} = ?`;

  console.log("SQL Query:", sql);

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (results.length === 0) {
      return res.status(200).json({ success: false, data: {} });
    }

    res.status(200).json({ success: true, data: results[0] });
  });
};
exports.cronjob = (req, res) => {
  res.status(200).json({ success: true, message: "Cron job executed" });
};
