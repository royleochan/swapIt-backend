const Chat = require("./models/chat");
const Message = require("./models/message");

const chatSocket = (io) => {
    io.on("connection", (socket) => {
        socket.on("join", async (roomId) => {
            try {
                socket.join(roomId);
                socket.emit("joined", roomId);
                socket.activeRoom = roomId;
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("message", async ({ userId, message, imageUrl }) => {
            try {
                let chat = await Chat.findById(socket.activeRoom);
                let msg = new Message({
                    creator: userId,
                    content: message,
                    imageUrl: imageUrl,
                });
                chat.messages.push(msg);
                await msg.save();
                await chat.save();
                socket.to(socket.activeRoom).emit("message", msg);
            } catch (e) {
                console.error(e);
            }
        });
    });
};

module.exports = chatSocket;
