//---- Imports ----//
const crypto = require("crypto");
const nodemailer = require("nodemailer");

//---- Mail Configurations ----//

// setup configuration and authentication
const mailerConfig = {
  service: "Godaddy",
  auth: {
    user: process.env.SWAPIT_EMAIL_ADDR,
    pass: process.env.SWAPIT_EMAIL_PASS,
  },
};

// create transporter object
const transporter = nodemailer.createTransport(mailerConfig);

// create send email function
const sendEmail = async (from, to, subject, text) => {
  const mailOptions = {
    from: {
      name: "SwapIt Singapore",
      address: from,
    },
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    throw err;
  }
};

module.exports = sendEmail;
