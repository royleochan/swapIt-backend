//---- Imports ----//
const crypto = require("crypto");
const sendEmail = require("../services/mail");

//---- Controllers ----//
const createReport = async (req, res, next) => {
  const { subject, email, description } = req.body;
  const id = crypto.randomBytes(3 * 4).toString("base64");

  const DEFAULT_MSG =
    "Thank you for your report.\n\nWe have created a correspondence for this case and our staff will get in touch with you shortly to assist you.\n\nBest Regards,\nSwapIt Support";

  try {
    // send mail to the user
    sendEmail(
      process.env.SWAPIT_EMAIL_ADDR,
      email,
      `📝[${subject}: Case ${id}]`,
      DEFAULT_MSG
    );

    // send mail to ourselves
    sendEmail(
      process.env.SWAPIT_EMAIL_ADDR,
      process.env.SWAPIT_EMAIL_ADDR,
      `📝[${subject}: Case ${id}]`,
      description
    );

    res.status(201).json({
      message: "Email sent",
    });
  } catch (err) {
    return next(err);
  }
};

exports.createReport = createReport;
