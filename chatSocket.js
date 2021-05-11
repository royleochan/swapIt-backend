const Chat = require("./models/chat");
const Message = require("./models/message");
const User = require("./models/user");

const createChatRoom = async (userId1, userId2) => {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    const createdChat = new Chat({
        users: [user1, user2],
        messages: [],
    });
    await createdChat.save();
};

const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected");
        socket.on("join", async (roomId) => {
            try {
                let result = await Chat.findById(roomId);
                if (!result) {
                    await createChatRoom(roomId);
                }
                socket.join(roomId);
                socket.emit("joined", roomId);
                socket.activeRoom = roomId;
            } catch (e) {
                console.error(e);
            }
        });
        socket.on("message", async ({ userId, message, imageUrl }) => {
            let chat = await Chat.findById(socket.activeRoom);
            let msg = new Message({
                creator: userId,
                content: message,
                imageUrl: imageUrl,
            })
            chat.messages.push(msg);
            await msg.save();
            await chat.save();
            io.to(socket.activeRoom).emit("message", message);
        });
    });
};

module.exports = chatSocket;
