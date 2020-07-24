const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");
const socketio = require("socket.io");

const HttpError = require("./models/http-error");
const Chat = require("./models/chat");
const User = require("./models/user");

const productsRoutes = require("./routes/products-routes");
const usersRoutes = require("./routes/users-routes");
const reviewsRoutes = require("./routes/reviews-routes");
const chatRoutes = require("./routes/chat-routes");
const notificationRoutes = require("./routes/notification-routes");

// Create a new Expo SDK client
let expo = new Expo();

const app = express();

app.use(bodyParser.json());

app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);

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

// Chat sessions
const sessionsMap = {};

// Messages Socket
const chatSocket = io.of("/chatsocket");
chatSocket.on("connection", function (socket) {
  // ask for user id
  socket.emit("askForUserId");

  // map user id to socket id
  socket.on("userIdReceived", (userId) => {
    sessionsMap[userId] = socket.id;
  });

  // Get chats from mongo db database
  socket.on("getChats", (data) => {
    console.log("getChats");
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
  socket.on("newMessage", async (data) => {
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
            if (sessionsMap[receiver] !== undefined) {
              chatSocket
                .to(sessionsMap[receiver]) // emit to specific socket id
                .emit(`output-${receiver}`, data.messages);
            }
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
              if (sessionsMap[receiver] !== undefined) {
                chatSocket
                  .to(sessionsMap[receiver]) // emit to specific socket id
                  .emit(`output-${sender}`, data.messages);
              }
            }
          );
        }
      })
      .catch((error) => {
        res.json(error);
      });

    // send new message notification
    let notifications = [];

    const user = await User.findById(receiver, { pushToken: 1 });
    const senderUser = await User.findById(sender, { name: 1 });

    const notification = {
      to: user.pushToken,
      sound: "default",
      title: "New Message",
      body: `${senderUser.name} has sent you a message`,
    };

    notifications.push(notification);

    let chunks = expo.chunkPushNotifications(notifications);
    let tickets = [];
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunks[0]);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.log(err);
    }
  });
});
