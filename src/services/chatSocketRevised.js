const Chat = require("../models/chat");
const Message = require("../models/message");

const chatSocketRevised = (io) => {
    console.log('setup chatSocketRevised!');
    io.on("connection", (socket) => {
        socket.on("join", async ({ chatId }) => {
            try {
                console.log("Attempting to join:", chatId);
                socket.join(chatId);
                socket.emit("joined", chatId);
                socket.activeRoom = chatId;
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("new message", async ({ chatId, userId, content }) => {
            try {
                let chat = await Chat.findById(socket.activeRoom);
                let msg = new Message({
                    creator: userId,
                    content: content,
                    imageUrl: "",
                });
                chat.messages.push(msg);
                await msg.save();
                await chat.save();
                socket.to(socket.activeRoom).emit("receive message", msg);
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("new image", async ({ chatId, userId, imageUrl }) => {
            try {
                let chat = await Chat.findById(socket.activeRoom);
                let msg = new Message({
                    creator: userId,
                    content: "",
                    imageUrl: imageUrl,
                });
                chat.messages.push(msg);
                await msg.save();
                await chat.save();
                socket.to(socket.activeRoom).emit("receive image", msg);
            } catch (e) {
                console.error(e);
            }
        });
    });
};

module.exports = chatSocketRevised;
