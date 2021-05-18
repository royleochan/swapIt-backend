const HttpError = require("../models/http-error");
const Chat = require("../models/chat");
const User = require("../models/user");

const getAllChatRooms = async (req, res, next) => {
    const userId = req.params.uid;
    let rooms;
    try {
        rooms = await User.findById(userId).populate("chats").populate("users");
    } catch (err) {
        const error = new HttpError(
            "Something went wrong, could not find the chat rooms.",
            500
        );
        return next(error);
    }
    if (!rooms) {
        const error = new HttpError("Could not find chat room with the chat room id", 404);
        return next(error);
    }
    res.json({ rooms: rooms.toObject({ getters: true }) });
};

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

const findMatchingRoom = async (req, res, next) => {
    const { uid1, uid2 } = req.params;
    let user, room;
    try {
        user = await User.findById(uid1).populate("chats");
        room = user.chats.find(chat => chat.users.includes(uid2));
    } catch (e) {
        console.error(e);
        const error = new HttpError(
            "Something went wrong, could not find the required matching room.",
            500
        );
        return next(error);
    }
    if (!room) {
        const error = new HttpError("Could not find matching room with the given user ids", 404);
        return next(error);
    }
    res.json({ room: room.toObject({ getters: true }) });
}

exports.getAllChatRooms = getAllChatRooms;
exports.getChatRoomById = getChatRoomById;
exports.findMatchingRoom = findMatchingRoom;
