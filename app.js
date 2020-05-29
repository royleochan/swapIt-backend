const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const productRoutes = require("./routes/products-routes");

const app = express();

app.use(bodyParser.json());

app.use("/api/products", productRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find route", 404);
  return next(error);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect("mongodb+srv://Roy:8Qurm#-Hgtcu$u4@cluster0-h3gax.mongodb.net/swapit?retryWrites=true&w=majority")
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
