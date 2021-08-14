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

exports.sendOtpEmail = sendOtpEmail;
