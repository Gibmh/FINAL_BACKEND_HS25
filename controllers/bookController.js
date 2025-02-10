const db = require("../models/db");

// Tạo mới đối tượng
exports.createObject = (req, res) => {
  const { typeOb, data } = req.body;
  if (!typeOb || !data)
    return res.status(400).json({ message: "Missing typeOb or data" });

  let query;
  switch (typeOb) {
    case "product":
      query = "INSERT INTO products SET ?";
      break;
    case "order":
      query = "INSERT INTO orders SET ?";
      break;
    case "member":
      query = "INSERT INTO members SET ?";
      break;
    case "consignor":
      query = "INSERT INTO consignors SET ?";
      break;
    default:
      return res.status(400).json({ message: "Invalid typeOb" });
  }

  console.log("SQL Query:", query); // Giám sát câu lệnh SQL
  console.log("Data to Insert:", data); // Giám sát dữ liệu được gửi

  db.query(query, [data], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Insert Results:", results); // Giám sát kết quả trả về
    res.status(201).json({
      success: true,
      message: "Create success!",
      id: results.insertId,
    });
  });
};

// Đọc tất cả đối tượng
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

  console.log("SQL Query:", query); // Giám sát câu lệnh SQL

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results); // Giám sát kết quả trả về
    res.status(200).json({ success: true, data: results });
  });
};

// Đọc thông tin đối tượng theo id_member
exports.readObjectById = (req, res) => {
  const { typeOb, id_member } = req.query;
  console.log("Request Params - typeOb:", typeOb, "id_member:", id_member); // Giám sát tham số truy vấn

  if (!typeOb || !id_member)
    return res.status(400).json({ message: "Missing typeOb or ID" });

  const validTables = ["products", "orders", "members", "consignors"];
  if (!validTables.includes(typeOb + "s"))
    return res.status(400).json({ message: "Invalid typeOb" });

  const query = `SELECT * FROM ${typeOb + "s"} WHERE id_member = ?`;
  console.log("SQL Query:", query); // Giám sát câu lệnh SQL

  db.query(query, [id_member], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results); // Giám sát kết quả trả về
    // if (results.length === 0)
    //   return res.status(404).json({ message: "Record not found" });
    res.status(200).json({ success: true, data: results });
  });
};

// Cập nhật đối tượng
exports.updateObject = (req, res) => {
  const { typeOb, id, data } = req.body;
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

  console.log("SQL Query:", query); // Giám sát câu lệnh SQL
  console.log("Data to Update:", data); // Giám sát dữ liệu được cập nhật

  db.query(query, [data, id], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Update Results:", results); // Giám sát kết quả trả về
    // if (results.affectedRows === 0)
    //   return res.status(404).json({ message: "No record found to update" });
    res.status(200).json({ success: true, message: "Updated successfully" });
  });
};

// Xóa đối tượng
exports.deleteObject = (req, res) => {
  const { typeOb, id } = req.params;
  if (!typeOb || !id)
    return res.status(400).json({ message: "Missing typeOb or ID" });

  let query;
  switch (typeOb) {
    case "product":
      query = "DELETE FROM products WHERE id_product = ?";
      break;
    case "order":
      query = "DELETE FROM orders WHERE id_bill = ?";
      break;
    case "member":
      query = "DELETE FROM members WHERE id_member = ?";
      break;
    case "consignor":
      query = "DELETE FROM consignors WHERE id_consignor = ?";
      break;
    default:
      return res.status(400).json({ message: "Invalid typeOb" });
  }

  console.log("SQL Query:", query); // Giám sát câu lệnh SQL

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Delete Results:", results); // Giám sát kết quả trả về
    // if (results.affectedRows === 0)
    //   return res.status(404).json({ message: "No record found to delete" });
    res
      .status(200)
      .json({ success: true, message: "Record deleted successfully" });
  });
};

// Tìm kiếm đối tượng
exports.searchObject = (req, res) => {
  const { typeOb, query, id_member } = req.query;
  console.log(
    "Search Params - typeOb:",
    typeOb,
    "query:",
    query,
    "id_member:",
    id_member
  ); // Giám sát tham số truy vấn

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

  console.log("SQL Query:", sql); // Giám sát câu lệnh SQL

  db.query(sql, [searchQuery, id_member], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Query Results:", results); // Giám sát kết quả trả về
    res.status(200).json({ success: true, data: results });
  });
};

// Đăng nhập
exports.login = (req, res) => {
  const { id_member, password } = req.body;
  if (!id_member || !password)
    return res.status(400).json({ message: "Missing id_member or password" });

  const sql = "SELECT * FROM members WHERE id_member = ? AND password = ?";

  console.log("SQL Query:", sql); // Giám sát câu lệnh SQL
  console.log("Login Params - id_member:", id_member, "password:", password); // Giám sát dữ liệu đăng nhập

  db.query(sql, [id_member, password], (err, results) => {
    if (err) return res.status(500).send(err.message);
    console.log("Login Results:", results); // Giám sát kết quả trả về
    if (results.length === 0)
      return res
        .status(401)
        .json({ status: false, message: "Invalid id_member or password" });
    res.status(200).json({ success: true, data: results });
  });
};
