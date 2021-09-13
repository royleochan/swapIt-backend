//---- External Imports ----//
const crypto = require("crypto");

//---- Services Imports ----//
const { sendTextEmail, sendReportEmail } = require("../services/mail");

//---- Controllers ----//
const createReport = async (req, res, next) => {
  const { subject, email, description, name, username } = req.body;
  const id = crypto.randomBytes(3 * 4).toString("base64");

  try {
    // send mail to the user
    sendReportEmail(
      process.env.SWAPIT_EMAIL_ADDR,
      email,
      `📝[${subject}: Case ${id}]`,
      name,
      username,
      description
    );

    // send mail to ourselves
    sendTextEmail(
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
