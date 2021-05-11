const HttpError = require("../models/http-error");
const Chat = require("../models/chat");

const getChatRoomById = async (req, res, next) => {
    const chatRoomId = req.params.rid;
    let room;
    try {
        room = await Chat.findById(chatRoomId).populate("messages").populate("users");
    } catch (err) {
        const error = new HttpError(
            "Something went wrong, could not find a chat room.",
            500
        );
        return next(error);
    }
    if (!room) {
        const error = new HttpError("Could not find chat room with the chat room id", 404);
        return next(error);
    }
    res.json({ room: room.toObject({ getters: true }) });
};

exports.getChatRoomById = getChatRoomById;
