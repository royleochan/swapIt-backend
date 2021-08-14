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

// create send email function
const sendEmail = async (from, to, subject, text) => {
  const mailOptions = {
    template: "hello",
    message: {
      from: {
        name: "SwapIt Singapore",
        address: from,
      },
      to,
    },
    locals: {
      subject,
      text,
    },
  };

  try {
    const info = await email.send(mailOptions);
    return info;
  } catch (err) {
    throw err;
  }
};

module.exports = sendEmail;
