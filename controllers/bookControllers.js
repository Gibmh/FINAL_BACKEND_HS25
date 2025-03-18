const db = require("../models/db");

exports.createObject = (req, res) => {
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
    order: { tableName: "orders", idField: "id_order", needCheckID: false },
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

  if (!needCheckID) {
    db.query(`INSERT INTO ${tableName} SET ?`, [data], (err, results) => {
      if (err) return res.status(500).send(err.message);

      if (data.cash_back && data.id_consignor) {
        db.query(
          `UPDATE consignors SET cash_back = cash_back + ? WHERE id_consignor = ?`,
          [data.cash_back, data.id_consignor],
          (err) => {
            if (err) return res.status(500).send(err.message);
          }
        );
      }

      return res.status(201).json({
        success: true,
        message: "Create success!",
        id: results.insertId,
      });
    });
    return;
  }

  db.query(
    `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${idField} = ?`,
    [data[idField]],
    (err, results) => {
      if (err) return res.status(500).send(err.message);

      if (results[0].count > 0) {
        return res
          .status(200)
          .json({ success: false, message: `${idField} already exists` });
      }

      if (typeOb == "product") {
        data.stock = data.quantity;
        db.query(
          `UPDATE consignors SET count = count + 1 WHERE id_consignor = ?`,
          [data.id_consignor],
          (err) => {
            if (err) return res.status(500).send(err.message);
          }
        );
        db.query(
          `UPDATE members SET count_books = count_books + 1 WHERE id_member = ?`,
          [data.id_member],
          (err) => {
            if (err) return res.status(500).send(err.message);
          }
        );
      }
      if (typeOb == "consignor") {
        db.query(
          `UPDATE members SET count_consignors = count_consignors + 1 WHERE id_member = ?`,
          [data.id_member],
          (err) => {
            if (err) return res.status(500).send(err.message);
          }
        );
      }

      db.query(`INSERT INTO ${tableName} SET ?`, [data], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.status(201).json({
          success: true,
          message: "Create success!",
          id: results.insertId,
        });
      });
    }
  );
};

exports.readAllObjects = (req, res) => {
  const { typeOb } = req.query;
  if (!typeOb) return res.status(400).json({ message: "Missing typeOb" });

  let query;
  switch (typeOb) {
    case "product":
      query = "SELECT * FROM products";
      break;
    case "order":
      query = "SELECT * FROM orders";
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

exports.readObjectById = (req, res) => {
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

exports.updateObject = (req, res) => {
  const { typeOb, id, data } = req.body;
  console.log(req.body);
  if (!typeOb || !id || !data)
    return res.status(400).json({ message: "Missing typeOb, ID or data" });

  let query;
  switch (typeOb) {
    case "product":
      query = "UPDATE products SET ? WHERE id_product = ?";
      break;
    case "order":
      query = "UPDATE orders SET ? WHERE id_bill = ?";
      break;
    case "member":
      query = "UPDATE members SET ? WHERE id_member = ?";
      break;
    case "consignor":
      query = "UPDATE consignors SET ? WHERE id_consignor = ?";
      break;
    default:
      return res.status(400).json({ message: "Invalid typeOb" });
  }

  console.log("SQL Query:", query);
  console.log("Data to Update:", data);

  db.query(query, [data, id], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Update Results:", results);
    res.status(200).json({ success: true, message: "Updated successfully" });
  });
};

exports.deleteObject = (req, res) => {
  const { typeOb, id } = req.query;
  if (!typeOb || !id) {
    return res.status(400).json({ message: "Missing typeOb or ID" });
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

          db.query(
            "UPDATE consignors SET count = count - 1 WHERE id_consignor = ?",
            [id_consignor],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(200).json({
                success: true,
                message:
                  "Product deleted successfully and consignor count updated",
              });
            }
          );
        });
      }
    );
    return;
  }

  if (typeOb === "order") {
    db.query("DELETE FROM orders WHERE id_bill = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res
        .status(200)
        .json({ success: true, message: "Order deleted successfully" });
    });
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
          });
        }
      }
    );
    return;
  }

  if (typeOb === "consignor") {
    db.query(
      "SELECT id_member FROM consignors WHERE id_consignor = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
          return res.status(404).json({ error: "Consignor not found" });
        }

        const id_member = results[0].id_member;

        db.query("DELETE FROM products WHERE id_consignor = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          db.query(
            "DELETE FROM consignors WHERE id_consignor = ?",
            [id],
            (err, results) => {
              if (err) return res.status(500).json({ error: err.message });

              if (results.affectedRows > 0) {
                db.query(
                  "UPDATE members SET count = count - 1 WHERE id_member = ?",
                  [id_member],
                  (err) => {
                    if (err)
                      return res.status(500).json({ error: err.message });

                    res.status(200).json({
                      success: true,
                      message:
                        "Consignor deleted successfully and member count updated",
                    });
                  }
                );
              } else {
                res.status(200).json({
                  success: true,
                  message: "No consignor found with the given ID",
                });
              }
            }
          );
        });
      }
    );
    return;
  }

  res.status(400).json({ error: "Invalid typeOb" });
};
exports.searchObject = (req, res) => {
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

exports.login = (req, res) => {
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
      return res
        .status(200)
        .json({ success: false, message: "Data not found" });
    }

    res.status(200).json({ success: true, data: results[0] });
  });
};
exports.cronjob = (req, res) => {
  res.status(200).json({ success: true, message: "Cron job executed" });
};
