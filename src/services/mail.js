//---- Imports ----//
const nodemailer = require("nodemailer");
const Email = require("email-templates");

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

// create email object
const email = new Email({
  transport: transporter,
  send: true,
  preview: false,
});

//---- Send Email Functions ----//

// normal text email
const sendTextEmail = async (from, to, subject, text) => {
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

// send otp html email
const sendOtpEmail = async (from, to, isEmail, subject, otp, name) => {
  const mailOptions = {
    template: isEmail ? "verifyEmail" : "resetPassword",
    message: {
      from: {
        name: "SwapIt Singapore",
        address: from,
      },
      to,
    },
    locals: {
      subject,
      otp,
      name,
    },
  };

  try {
    const info = await email.send(mailOptions);
    return info;
  } catch (err) {
    throw err;
  }
};

// send report html email
const sendReportEmail = async (from, to, subject, name, username, content) => {
  const mailOptions = {
    template: "report",
    message: {
      from: {
        name: "SwapIt Singapore",
        address: from,
      },
      to,
    },
    locals: {
      subject,
      name,
      username,
      content,
    },
  };

  try {
    const info = await email.send(mailOptions);
    return info;
  } catch (err) {
    throw err;
  }
};

exports.sendTextEmail = sendTextEmail;
exports.sendOtpEmail = sendOtpEmail;
exports.sendReportEmail = sendReportEmail;
