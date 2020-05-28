const express = require("express");
const bodyParser = require("body-parser");

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
    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occurred!'});
  });

app.listen(5000);
