const nodemailer = require("nodemailer");
require("dotenv").config();

exports.sendEmail = async function sendEmail({ to, subject, text, html }) {
  const from = process.env.mail;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: from,
      pass: process.env.pass,
    },
  });

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
};
