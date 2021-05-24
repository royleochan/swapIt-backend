const Chat = require("./models/chat");
const Message = require("./models/message");

const chatSocket = (io) => {
    io.on("connection", (socket) => {
        socket.on("messages screen", (userId) => {
            socket.join(userId);
            socket.emit("messages joined");
        });
        socket.on("join", async (roomId) => {
            try {
                socket.join(roomId);
                //await updateSeen
                socket.emit("joined", roomId);
                socket.activeRoom = roomId;
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("message", async ({ otherUserId, userId, message, imageUrl }) => {
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
                socket.to(otherUserId).emit("new message", msg);
            } catch (e) {
                console.error(e);
            }
        });
    });
};

module.exports = chatSocket;
