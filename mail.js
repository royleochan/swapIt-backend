// import nodemailer
const nodemailer = require("nodemailer");

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

// setup email options
const mailOptions = {
  from: "SwapIt Singapore <contact@swapit.sg>",
  to: "<Insert test email here>",
  subject: "Test 👻",
  text: "SwapIt right now!",
};

// use transporter to send mail
const sendTest = async () => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendTest;
