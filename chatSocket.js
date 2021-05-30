const Chat = require("./models/chat");
const Message = require("./models/message");

const updateMessagesSeen = async (chatId, currUser) => {
    try {
        let chat = await Chat.findById(chatId);
        const messagesIdArray = chat.messages;
        await Message.updateMany(
            {
                _id: { $in: messagesIdArray },
                seen: { $eq: false },
                creator: { $not: { $eq: currUser } }
            },
            { $set: { "seen": true } },
            { multi: true },
        );
    } catch (e) {
        console.error(e);
    }
};

const chatSocket = (io) => {
    io.on("connection", (socket) => {
        socket.on("messages screen", (userId) => {
            socket.join(userId);
            socket.emit("messages joined");
        });
        socket.on("join", async ({ chatId, currUser }) => {
            try {
                socket.join(chatId);
                await updateMessagesSeen(chatId, currUser);
                socket.emit("joined", chatId);
                socket.activeRoom = chatId;
                socket.to(chatId).emit("user connected", currUser);
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("respond connected", ({ chatId, currUser }) => {
            socket.to(chatId).emit("connected response", currUser);
        });
        socket.on("message", async ({ chatId, otherUserId, userId, message, imageUrl, seen }) => {
            try {
                let chat = await Chat.findById(socket.activeRoom);
                let msg = new Message({
                    creator: userId,
                    content: message,
                    imageUrl: imageUrl,
                    seen: seen,
                });
                chat.messages.push(msg);
                await msg.save();
                await chat.save();
                // socket.to(socket.activeRoom).emit("message", msg); //Todo: Logic no longer requires
                //Sends event to both parties as they have to update their messages in redux store
                io.to(otherUserId).to(userId).emit("new message", { chatId: chatId, message: msg });
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("leave room", async ({ chatId, currUser }) => {
            socket.leave(chatId);
            socket.to(chatId).emit("user disconnect", currUser);
            try {
                let chat = await Chat.findById(socket.activeRoom);
                const userIndex = `${chat.users[0]._id}` === currUser ? 0 : 1;
                chat.lastSeen[userIndex] = new Date();
                chat.markModified('lastSeen');
                await chat.save();
            } catch (e) {
                console.error(e);
            }
        });
    });
};

module.exports = chatSocket;
