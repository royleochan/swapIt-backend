const express = require("express");
const bodyParser = require("body-parser");

const productRoutes = require("./routes/products-routes");

const app = express();

app.use(productRoutes);

app.listen(5000);
