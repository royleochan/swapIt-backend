const mongoose = require("mongoose");

const Chat = require("../models/chat");
const Message = require("../models/message");

const sendPushNotification = require("./pushNotification");

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Received a Connection");
    socket.on("join", async ({ chatIdList }) => {
      try {
        console.log(chatIdList);
        console.log("Attempting to join:", chatIdList);
        socket.join(chatIdList);
        socket.emit("joined", {chatIdList});
        console.log("Joined", chatIdList);
      } catch (e) {
        console.error(e);
      }
    });
    socket.on("new message", async ({ chatId, userId, content }) => {
      console.log("new message:", content);
      try {
        let chat = await Chat.findById(chatId).populate({
          path: "users",
          select: "name pushToken",
        });
        let msg = new Message({
          creator: userId,
          content: content,
          imageUrl: "",
        });
        const sess = await mongoose.startSession();
        sess.startTransaction();
        chat.messages.push(msg);
        await msg.save({ session: sess });
        await chat.save({ session: sess });
        await sess.commitTransaction();
        socket.to(chatId).emit("receive message", { chatId, msg });

        // Send Notification: can fail
        const receivingUser = chat.users.find(
          (usr) => usr._id.toString() !== userId.toString()
        );
        const sendingUser = chat.users.find(
          (usr) => usr._id.toString() === userId.toString()
        );
        await sendPushNotification(
          receivingUser.pushToken,
          sendingUser.name,
          content
        );
      } catch (e) {
        console.error(e);
      }
    });
    socket.on("new image", async ({ chatId, userId, imageUrl }) => {
      console.log("new image:", imageUrl);
      try {
        let chat = await Chat.findById(chatId).populate({
          path: "users",
          select: "name pushToken",
        });
        let msg = new Message({
          creator: userId,
          content: "",
          imageUrl: imageUrl,
        });
        const sess = await mongoose.startSession();
        sess.startTransaction();
        chat.messages.push(msg);
        await msg.save({ session: sess });
        await chat.save({ session: sess });
        socket.to(chatId).emit("receive image", { chatId, msg });

        // Send Notification: can fail
        const receivingUser = chat.users.find(
          (usr) => usr._id.toString() !== userId.toString()
        );
        const sendingUser = chat.users.find(
          (usr) => usr._id.toString() === userId.toString()
        );
        await sendPushNotification(
          receivingUser.pushToken,
          sendingUser.name,
          `${sendingUser.name} sent you an image`
        );
      } catch (e) {
        console.error(e);
      }
    });
  });
};

module.exports = chatSocket;
