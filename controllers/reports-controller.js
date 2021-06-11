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

//---- Controllers ----//
const createReport = async (req, res, next) => {
  const { subject, email, description } = req.body;
  const id = crypto.randomBytes(3 * 4).toString("base64");

  const DEFAULT_MSG =
    "Thank you for your report.\n\nWe have created a correspondence for this case and our staff will get in touch with you shortly to assist you.\n\nBest Regards,\nSwapIt Support";

  try {
    // send mail to the user
    const emailInfo = await sendEmail(
      mailerConfig.auth.user,
      email,
      `📝[${subject}: Case ${id}]`,
      DEFAULT_MSG
    );

    // send mail to ourselves
    await sendEmail(
      mailerConfig.auth.user,
      mailerConfig.auth.user,
      `📝[${subject}: Case ${id}]`,
      description
    );

    res.status(201).json({
      emailInfo,
    });
  } catch (err) {
    return next(err);
  }
};

exports.createReport = createReport;
