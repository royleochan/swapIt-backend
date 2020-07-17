const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const socketio = require("socket.io");

const HttpError = require("./models/http-error");
const Chat = require("./models/chat");

const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const reviewsRoutes = require("./routes/reviews-routes");
const chatRoutes = require("./routes/chat-routes");

const app = express();

app.use(bodyParser.json());

app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/chats", chatRoutes);

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

const server = app.listen(process.env.PORT || 5000);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-h3gax.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .catch((err) => {
    console.log(err);
  });

// Chat Logic
const io = socketio(server);

// Messages Socket
const chatSocket = io.of("/chatsocket");
chatSocket.on("connection", function (socket) {
  // Get chats from mongo db database
  socket.on("getChats", (data) => {
    const { userId } = data;
    const chat = Chat.find({
      $or: [{ receiver: userId }, { sender: userId }],
    })
      .populate("receiver", { name: 1, profilePic: 1 })
      .populate("sender", { name: 1, profilePic: 1 });

    // Emit the chats
    chat.exec().then((data) => {
      if (data === null) {
        socket.emit("resultChats", []);
      } else {
        socket.emit("resultChats", data);
      }
    });
  });

  // Get messages from mongo db database
  socket.on("getMessages", (data) => {
    const { sender, receiver } = data;
    const chat = Chat.findOne({
      $or: [
        { receiver: receiver, sender: sender },
        { receiver: sender, sender: receiver },
      ],
    });

    chat.exec().then((data) => {
      if (data === null) {
        socket.emit("resultMessages", []);
      } else {
        socket.emit("resultMessages", data);
      }
    });
  });

  // Handle new messages
  socket.on("newMessage", (data) => {
    const { receiver, sender, messages } = data;

    const query = Chat.findOne({
      $or: [
        { receiver: receiver, sender: sender },
        { receiver: sender, sender: receiver },
      ],
    });
    query
      .exec()
      .then((res) => {
        if (res === null) {
          const chat = new Chat({
            sender,
            receiver,
            messages,
          });

          chat.save().then(() => {
            chatSocket.emit("output", data.messages);
          });
        } else {
          const updateChat = Chat.updateOne(
            {
              $or: [
                { receiver: receiver, sender: sender },
                { receiver: sender, sender: receiver },
              ],
            },
            { $set: { messages: messages } },
            () => {
              chatSocket.emit("output", data.messages);
            }
          );
        }
      })
      .catch((error) => {
        res.json(error);
      });
  });
});
