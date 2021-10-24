const express = require("express");
const mongoose = require("mongoose");
const socketio = require("socket.io");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const swaggerJsdoc = require("swagger-jsdoc");

const s3GenerateUploadURL = require("./src/services/s3");
const HttpError = require("./src/models/http-error");

const productsRoutes = require("./src/routes/products-routes");
const usersRoutes = require("./src/routes/users-routes");
const reviewsRoutes = require("./src/routes/reviews-routes");
const chatsRoutes = require("./src/routes/chats-routes");
const matchesRoutes = require("./src/routes/matches-routes");
const notificationsRoutes = require("./src/routes/notifications-routes");
const reportsRoutes = require("./src/routes/reports-routes");
const otpRoutes = require("./src/routes/otp-routes");

require("dotenv").config();
const isTesting = process.env.NODE_ENV === "testing";

// create server
const app = express();
exports.app = app;
const port = isTesting ? 9000 : process.env.PORT || 5000;

// setup swagger
const specs = swaggerJsdoc(swaggerDocument);
app.use("/index", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// start server
let server;
if (!isTesting) {
  server = app.listen(port, () => {
    console.log("Server listening on port: %s", port);
  });

  // set timeout for requests to be 20 seconds
  server.setTimeout(20000);
}

// start chat socket
const io = socketio(server);
const chatSocket = io.of("/chatSocket");
require("./src/services/chatSocket")(chatSocket);

// setup logging
if (!isTesting) {
  app.use(morgan("dev"));
}

// log errors
app.use((error, req, res, next) => {
  console.error(error);
  return next(error);
});

// connect routes
app.use(express.json());
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/otp", otpRoutes);

// route to handle retrieval of s3 image upload url
app.get("/api/s3Url", async (req, res) => {
  const url = await s3GenerateUploadURL();
  res.send({ url });
});

// error handling
app.use((req, res, next) => {
  const error = new HttpError("Could not find route", 404);
  return next(error);
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

// connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${
      process.env.DB_PASSWORD
    }@cluster0.cqmho.mongodb.net/${
      isTesting ? process.env.TEST_DB_NAME : process.env.DB_NAME
    }?retryWrites=true&w=majority`,
    {
      useFindAndModify: false,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    }
  )
  .catch((err) => {
    console.error(err);
  });
