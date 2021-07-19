const express = require("express");
const mongoose = require("mongoose");
const socketio = require("socket.io");
const morgan = require("morgan");

const s3GenerateUploadURL = require("./services/s3");
const HttpError = require("./models/http-error");

const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const reviewsRoutes = require("./routes/reviews-routes");
const chatsRoutes = require("./routes/chats-routes");
const matchesRoutes = require("./routes/matches-routes");
const notificationsRoutes = require("./routes/notifications-routes");
const reportsRoutes = require("./routes/reports-routes");

// start server
const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log("Server listening on port: %s", port);
});

// set timeout for requests to be 6 seconds
server.setTimeout(6000);

// start chat socket
const io = socketio(server);
const chatSocket = io.of("/chatSocket");
require("./services/chatSocket")(chatSocket);

// setup logging
app.use(morgan("dev"));

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
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cqmho.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
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
