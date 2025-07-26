const db = require("../models/db");
const { log } = require("../controllers/updatesheet");
const { sendEmail } = require("../send_mail/mail_sending");
const e = require("express");

// const generateEmailHTML = (userInfo, events) => {
//   const { name, email, attender_id } = userInfo;

//   const eventCards = events
//     .map(
//       (event) => `
//   <div class="event-card"
// 	  style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
// 	  <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
// 		  <div style="flex: 1;">
// 			  <h4 style="color: #333333; font-size: 16px; margin-bottom: 5px;">${event.program_name}</h4>
// 			  <p style="color: #666666; font-size: 14px; margin-bottom: 10px;">⏰ ${event.time}</p>
// 		  </div>
// 	  </div>
//   </div>
//   `
//     )
//     .join("");

//   const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
//     attender_id
//   )}&size=200x200`;

//   return `
//   <!DOCTYPE html>
//   <html lang="vi">

// 	  <head>
// 		  <meta charset="UTF-8">
// 		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
// 		  <title>Xác nhận đăng ký - Hội Sách Mơ Hỏi Mở</title>
// 		  <style>
// 			  /* Reset styles */
// 			  * {
// 				  margin: 0;
// 				  padding: 0;
// 				  box-sizing: border-box;
// 			  }

// 			  body {
// 				  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
// 				  line-height: 1.6;
// 				  color: #333333;
// 				  background-color: #f8f9fa;
// 			  }

// 			  .container {
// 				  max-width: 600px;
// 				  margin: 0 auto;
// 				  background-color: #ffffff;
// 			  }
// 		  </style>
// 	  </head>

// 	  <body style="margin: 0; padding: 20px; background-color: #f8f9fa;">
// 		  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa;">
// 			  <tr>
// 				  <td align="center" style="padding: 20px 0;">
// 					  <table cellpadding="0" cellspacing="0" border="0" width="600" class="container"
// 						  style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
// 						  <tr>
// 							  <td
// 								  style="background: linear-gradient(135deg, #f6d55c 0%, #ed8d53 50%, #f15824 100%); padding: 40px 30px; text-align: center;">
// 								  <h1 style="color: #ffffff; font-size: 28px; font-weight: bold;">Hội Sách Mơ Hỏi Mở</h1>
// 								  <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px;">Xác nhận đăng ký tham gia
// 									  sự kiện</p>
// 							  </td>
// 						  </tr>
// 						  <tr>
// 							  <td style="padding: 30px;">
// 								  <h3 style="color: #333333; font-size: 18px;">Thông tin người đăng ký</h3>
// 								  <table cellpadding="0" cellspacing="0" border="0" width="100%"
// 									  style="background-color: #f8f9fa; border-radius: 8px;">
// 									  <tr>
// 										  <td style="padding: 15px; border-bottom: 1px solid #e9ecef;">
// 											  <strong style="color: #495057;">👤 Họ và tên:</strong>
// 											  <span style="color: #6c757d; margin-left: 10px;">${name}</span>
// 										  </td>
// 									  </tr>
// 								  </table>
// 							  </td>
// 						  </tr>
// 						  <tr>
// 							  <td style="padding: 30px;">
// 								  <h3 style="color: #333333; font-size: 18px;">🎯 Sự kiện đã đăng ký</h3>
// 								  ${eventCards}
// 							  </td>
// 						  </tr>
// 						  <tr>
// 							  <td style="padding: 30px; text-align: center;">
// 								  <h3 style="color: #333333; font-size: 18px;">📌 Mã QR của bạn</h3>
// 								  <img src="${qrApiUrl}" alt="QR Code" style="width: 150px; height: 150px; border: 1px solid #e9ecef; border-radius: 8px;">
// 								  <p style="color: #666666; font-size: 14px; margin-top: 10px;">Chụp lại mã QR này để sử dụng tại sự kiện.</p>
// 							  </td>
// 						  </tr>
// 					  </table>
// 				  </td>
// 			  </tr>
// 		  </table>
// 	  </body>

//   </html>
//   `;
// };
const generateEmailHTML = (userInfo, programs) => {
  const { name, attender_id } = userInfo;

  const programList = programs
    .map(
      (program) => `
      <li style="font-size: 14px; font-family: 'Be Vietnam Pro', sans-serif; color: #485aa1; line-height: 24px; text-align: justify;">
        <span style="font-weight: bold; color: #F05824;">${program.program_name}</span>
        vào lúc ${program.time}
      </li>
    `
    )
    .join("");

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    attender_id
  )}&size=200x200`;

  return `
  <!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đăng ký - Hội Sách Mơ Hỏi Mở</title>
    </head>
    <body style="margin: 0; padding: 0; width: 100%; background-color: #f3f3f3; font-family: 'Be Vietnam Pro', sans-serif;">
      <div style="max-width: 512px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">    
          <a
                                                                                        href="https://www.facebook.com/hoisachmohoimo"
                                                                                        style="font-size: 10px;"
                                                                                        target="_blank"> <img
                                                                                            src="https://drive.google.com/thumbnail?id=1Swbha9axvfGQb4ptjqgpQ3fJUx522x9s&sz=w2500"
                                                                                            width="100%"
                                                                                            alt="Chọn 'I trust content from mohoimo.hoisach@gmail.com' nếu banner không được hiện lên đúng cách."
                                                                                            style="display:block;border:0;font-size: 12px;font-family:Be Vietnam Pro,sans-serif;color:#485aa1;"
                                                                                            class="CToWUd"> </a>
        <div style="padding: 20px 26px;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            Thân chào <span style="font-weight: bold; color: #F05824;">${name}</span>,
          </p>
         <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            Lời đầu tiên, chúng mình xin chân thành cảm ơn bạn đã quan tâm và đăng ký tham gia <span style="font-weight: bold; color: #F05824;">Hội sách Mơ Hỏi Mở 2025</span>. Tuy nhiên, vì một vài sai sót mà chúng mình đã ghi nhận chưa chính xác một số hoạt động tại Hội sách mà bạn đã đăng ký. Vì thế, chúng mình xin phép gửi lại email này để xác nhận lại thông tin đăng ký một cách đầy đủ và đúng nhất.

          </p>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            <span style="font-weight: bold; color: #F05824;">Các sự kiện đã đăng ký:</span>
          </p>
          <ul style="margin: 0 0 15px 0; padding-left: 20px;">
            ${programList}
          </ul>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            <span style="font-weight: bold; color: #F05824;">Địa điểm tổ chức:</span> Trung tâm Văn hóa
                                                                                    Vĩnh Long (Trung tâm Văn hoá - Điện
                                                                                    ảnh tỉnh Bến Tre cũ) - 88/1 Đường 30
                                                                                    Tháng 4, phường An Hội, tỉnh
                                                                                    Vĩnh Long.
          </p>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            Chúng mình rất hân hạnh được chào đón
                                                                                    bạn đến với Hội sách - nơi quy tụ
                                                                                    những đầu sách bổ ích, các cuộc trò
                                                                                    chuyện
                                                                                    truyền cảm hứng và nhiều hoạt động
                                                                                    vui chơi hấp dẫn khác.
          </p>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            Để thuận tiện cho việc điểm danh khi đến sự kiện, bạn vui lòng sử dụng mã QR dưới đây nhé. Bạn có thể lưu mã này vào điện thoại hoặc in ra giấy.
          </p>
            <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <img src="${qrApiUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
            </div>  
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">

            Một lần nữa, chúng mình cảm ơn bạn vì đã thấu hiểu và thông cảm cho sự nhầm lẫn của chúng mình. Nếu có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng mình qua email này hoặc <a href="https://www.facebook.com/hoisachmohoimo" style="font-size: 14px; font-weight: bold; color: #F05824; text-align: justify; line-height: 24px;">fanpage của Hội sách Mơ Hỏi Mở</a>. Hẹn gặp bạn tại Hội sách Mơ Hỏi Mở 2025!
          </p>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #485aa1; line-height: 24px; text-align: justify;">
            Thân ái,<br><span style="font-weight: bold; color: #F05824;">Ban Tổ Chức Hội sách Mơ Hỏi Mở 2025</span>
          </p>
<a
                                                                                                        href="https://www.facebook.com/hoisachmohoimo"
                                                                                                        style="font-size: 10px;"
                                                                                                        target="_blank">
                                                                                                        <img src="https://drive.google.com/thumbnail?id=188q1S0pIF50eOgxHYclkFAFBbRZezimv&sz=w2500"
                                                                                                            width="100%"
                                                                                                            alt="Chọn 'I trust content from mohoimo.hoisach@gmail.com' nếu banner không được hiện lên đúng cách."
                                                                                                            style="display:block;border:0;font-size: 12px;font-family:Be Vietnam Pro,sans-serif;color:#485aa1;"
                                                                                                            class="CToWUd">
                                                                                                    </a>
        </div>
      </div>
    </body>
  </html>
  `;
};

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

      // Chỉ lấy name và price của product, và quantity của order
      const ordersWithInfo = await Promise.all(
        orderResults.map(async (order) => {
          const [productResults] = await db
            .promise()
            .query(`SELECT * FROM products WHERE id_product = ?`, [
              order.id_product,
            ]);

          //let product = productResults[0] || {};
          productResults[0].quantity = order.quantity || 0;

          return productResults[0];
        })
      );

      responseData.orders = ordersWithInfo;

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
    // âœ… Láº¥y táº¥t cáº£ thÃ nh viÃªn cÃ³ vai trÃ² lÃ  'cashier' hoáº·c 'Admin'
    const [memberResult] = await db
      .promise()
      .query(
        "SELECT id_member, name FROM members WHERE id_member IN (SELECT id_member FROM receipts GROUP BY id_member HAVING COUNT(*) > 0 )"
      );

    for (const member of memberResult) {
      let KG = 0,
        QG = 0,
        TK = 0,
        NXB = 0,
        TotalReceipt = 0,
        totalvoucher = 0,
        cash = 0,
        banking = 0;

      // âœ… Láº¥y cÃ¡c hÃ³a Ä‘Æ¡n cá»§a tá»«ng member
      const [receipts] = await db
        .promise()
        .query(
          "SELECT id_receipt, total_amount, voucher, payment_method FROM receipts WHERE id_member = ?",
          [member.id_member]
        );

      if (!Array.isArray(receipts)) {
        console.error(
          `âŒ receipts khÃ´ng pháº£i lÃ  máº£ng cho member ${member.id_member}`
        );
        continue;
      }

      TotalReceipt = receipts.length;

      for (const receipt of receipts) {
        const totalAmount = receipt.total_amount || 0;
        const voucher = receipt.voucher || 0;

        totalvoucher += voucher;

        if (receipt.payment_method === "cash") {
          cash += totalAmount - voucher;
          console.log(cash);
          if (cash % 1000 >= 500) cash = cash + 1000 - (cash % 1000);
          else cash = cash - (cash % 1000);
          console.log("after", cash);
        } else {
          banking += totalAmount - voucher;
        }

        // âœ… Láº¥y danh sÃ¡ch orders cá»§a hÃ³a Ä‘Æ¡n
        const [orders] = await db
          .promise()
          .query(
            "SELECT id_product, quantity, price FROM orders WHERE id_receipt = ?",
            [receipt.id_receipt]
          );

        if (!Array.isArray(orders)) continue;

        for (const order of orders) {
          const [productRows] = await db
            .promise()
            .query("SELECT classify FROM products WHERE id_product = ?", [
              order.id_product,
            ]);

          const classify = productRows[0]?.classify || "";
          let amount = 0;
          if (classify !== "Khác") {
            amount = (order.quantity || 0) * (order.price || 0);
          }

          if (classify === "Sách Ký Gửi") {
            KG += amount;
          } else if (classify === "Sách Quyên Góp") {
            QG += amount;
          } else if (classify === "Bán Kg") {
            TK += amount;
          } else if (classify === "Sách NXB") {
            NXB += amount;
          }
        }
      }

      // âœ… Cáº­p nháº­t thá»‘ng kÃª cho member
      (member.totalMoney = cash + banking), //KG + QG + TK + NXB - totalvoucher;
        (member.totalReceipt = TotalReceipt);
      member.totalVoucher = totalvoucher;
      member.totalCash = cash;
      member.totalBanking = banking;
      member.totalKG = KG;
      member.totalQG = QG;
      member.totalTK = TK;
      member.totalNXB = NXB;
    }

    // âœ… Gá»­i káº¿t quáº£
    res.status(200).json({
      success: true,
      data: memberResult,
    });
  } catch (err) {
    console.error("ðŸ”¥ Lá»—i xá»­ lÃ½ OrderStatistics:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.OrderStatisticsByCashier = async (req, res) => {
  const { id_member } = req.query;
  try {
    let KG = 0,
      QG = 0,
      TK = 0,
      NXB = 0,
      TotalReceipt = 0,
      totalvoucher = 0,
      cash = 0,
      banking = 0;
    if (!id_member) {
      return res
        .status(400)
        .json({ success: false, message: "Missing id_member" });
    }
    const [receipts] = await db
      .promise()
      .query("SELECT * FROM receipts WHERE id_member = ?", [id_member]);
    const [cashierInfo] = await db
      .promise()
      .query("SELECT * FROM members WHERE id_member = ?", [id_member]);
    if (cashierInfo.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cashier not found" });
    }
    TotalReceipt += receipts.length;
    for (const receipt of receipts) {
      const totalAmount = receipt.total_amount || 0;
      const voucher = receipt.voucher || 0;

      totalvoucher += voucher;

      if (receipt.payment_method === "cash") {
        cash += totalAmount - voucher;
        console.log(cash);
        if (cash % 1000 >= 500) cash = cash + 1000 - (cash % 1000);
        else cash = cash - (cash % 1000);
        console.log("after", cash);
      } else {
        banking += totalAmount - voucher;
      }

      // âœ… Láº¥y danh sÃ¡ch orders cá»§a hÃ³a Ä‘Æ¡n
      const [orders] = await db
        .promise()
        .query(
          "SELECT id_product, quantity, price FROM orders WHERE id_receipt = ?",
          [receipt.id_receipt]
        );

      if (!Array.isArray(orders)) continue;

      for (const order of orders) {
        const [productRows] = await db
          .promise()
          .query("SELECT classify FROM products WHERE id_product = ?", [
            order.id_product,
          ]);

        const classify = productRows[0]?.classify || "";
        let amount = 0;
        if (classify !== "KhÃ¡c") {
          amount = (order.quantity || 0) * (order.price || 0);
        }

        if (classify === "Sách Ký Gửi") {
          KG += amount;
        } else if (classify === "Sách Quyên Góp") {
          QG += amount;
        } else if (classify === "Bán Kg") {
          TK += amount;
        } else if (classify === "Sách NXB") {
          NXB += amount;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id_member: id_member,
        cashier_name: cashierInfo[0].name,
        totalReceipt: TotalReceipt,
        totalMoney: cash + banking, // KG + QG + TK + NXB - totalvoucher,
        totalVoucher: totalvoucher,
        totalCash: cash,
        totalBanking: banking,
        totalKG: KG,
        totalQG: QG,
        totalTK: TK,
        totalNXB: NXB,
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
    let subject, text;
    if (state === "new") {
      subject = "[HS25] XÁC NHẬN ĐĂNG KÝ THAM GIA";
      text = `Thanks ${attender_name} for registering for the event!`;
    } else {
      //subject = "[HS25] CẬP NHẬT ĐĂNG KÝ THAM GIA";
      subject = "[HS25] XÁC NHẬN ĐĂNG KÝ THAM GIA";
      text = `Hello ${attender_name}, your registration has been updated.`;
    }
    const userInfo = {
      attender_id: attender_id,
      name: attender_name,
      email: email,
    };

    let allEventRows = [];

    for (const program of programs) {
      const [rows] = await db
        .promise()
        .query("SELECT * FROM programs WHERE program_id = ?", [
          program.program_id,
        ]);
      console.log("Program id:", program.program_id);
      allEventRows.push(...rows); // Nếu rows là mảng kết quả
    }

    const html = generateEmailHTML(userInfo, allEventRows);
    await sendEmail({ to: email, subject, text, html: html });

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
    for (const row of rows) {
      const [attendanceRows] = await db
        .promise()
        .query("SELECT * FROM attendance WHERE attender_id = ?", [
          row.attender_id,
        ]);
      row.attendance = attendanceRows;
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.CheckIn = async (req, res) => {
  const { attender_id, program_id, id_member } = req.body;

  if (!attender_id || !program_id || !id_member) {
    return res.status(400).json({
      success: false,
      message: "Missing attender_id or program_id",
    });
  }
  console.log(
    "CheckIn Params - attender_id:",
    attender_id,
    "program_id:",
    program_id,
    "id_member:",
    id_member
  );

  try {
    // Kiểm tra xem bản ghi có tồn tại không
    const [checkRows] = await db
      .promise()
      .query("SELECT * FROM attendance WHERE attender_id = ?", [attender_id]);
    if (checkRows.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Mã người tham dự không tồn tại",
      });
    }
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM attendance WHERE attender_id = ? AND program_id = ?",
        [attender_id, program_id]
      );
    console.log("Attendance Rows:", rows);
    if (rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Người tham dự không đăng ký chương trình này",
      });
    }
    const now = new Date();
    now.setHours(now.getHours() + 7);
    const formattedTime = now.toISOString().slice(0, 19).replace("T", " ");
    console.log("Formatted Check-in Time:", formattedTime);
    const [result] = await db
      .promise()
      .query(
        "UPDATE attendance SET checkin_time = ? , attended = 1, id_member = ? WHERE program_id = ? AND attender_id = ?",
        [formattedTime, id_member, program_id, attender_id]
      );
    // if (result.affectedRows === 0) {
    //   return res.status(200).json({
    //     success: false,
    //     message: " ",
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: "Check-in thành công",
      //data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + err.message,
    });
  }
};

exports.getListbookvalidate = async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM products WHERE validate = 1");
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCheckInList = async (req, res) => {
  try {
    const program_id = ["1_KM", "2_VHLS", "3_NT", "4_DN", "5_TV"];
    let person_accepted = [];

    const [attenders] = await db.promise().query("SELECT * FROM attender");

    for (const attender of attenders) {
      const [data_checkin] = await db.promise().query(
        `SELECT COUNT(*) as cnt
       FROM attendance 
       WHERE attender_id = ? 
         AND attended = 1 
         AND program_id IN (?)`,
        [attender.attender_id, program_id]
      );

      const count = data_checkin[0].cnt;

      if (count > 2) {
        person_accepted.push(attender); // chỉ cần push người
      }
    }

    return res.status(200).json({ success: true, data: person_accepted });

    // const acceptedMap = {}; // Dùng để đếm số lần tham gia của từng người

    // for (const row of rows) {
    //   if (program_id.includes(row.program_id) && row.attended === 1) {
    //     if (!acceptedMap[row.attender_id]) {
    //       acceptedMap[row.attender_id] = { count: 0, sampleRow: row };
    //     }
    //     acceptedMap[row.attender_id].count += 1;
    //   }
    // }

    // // Duyệt và lấy những người đã tham gia > 2 lần
    // for (const attender_id in acceptedMap) {
    //   if (acceptedMap[attender_id].count > 2) {
    //     person_accepted.push(acceptedMap[attender_id].sampleRow);
    //   }
    // }

    // return res.status(200).json({ success: true, data: person_accepted });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
exports.OrderStatisticsConsignor = async (req, res) => {
  try {
    let data = [];
    const [consignors] = await db.promise().query("SELECT * FROM consignors");
    for (consignor of consignors) {
      let [sale] = await db
        .promise()
        .query(
          "SELECT SUM(price * sold) AS total_sale FROM products WHERE id_consignor = ?",
          [consignor.id_consignor]
        );
      let [cash_back] = await db
        .promise()
        .query(
          "SELECT SUM(cash_back * sold) AS total_cash_back FROM products WHERE id_consignor = ?",
          [consignor.id_consignor]
        );
      let [sold] = await db
        .promise()
        .query(
          "SELECT SUM(sold) AS total_sold FROM products WHERE id_consignor = ?",
          [consignor.id_consignor]
        );
      let [products] = await db
        .promise()
        .query("SELECT * FROM products WHERE id_consignor = ? AND sold > 0", [
          consignor.id_consignor,
        ]);
      let total_cash_back = cash_back[0].total_cash_back || 0;
      let total_sale = sale[0].total_sale || 0;
      let total_sold = sold[0].total_sold || 0;
      if (total_sale > 0)
        data.push({
          id_consignor: consignor.id_consignor,
          name: consignor.name,
          total_sale: parseInt(total_sale),
          total_cash_back: parseInt(total_cash_back),
          profited: total_sale - total_cash_back,
          total_sold: parseInt(total_sold),
          sold_products: products,
        });
    }
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
