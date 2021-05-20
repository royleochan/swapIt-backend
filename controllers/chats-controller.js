const HttpError = require("../models/http-error");
const Chat = require("../models/chat");
const User = require("../models/user");
const mongoose = require("mongoose");

const getAllChatRooms = async (req, res, next) => {
    const userId = req.params.uid;
    let rooms;
    try {
        rooms = await User.findById(userId).populate({
            path: "chats",
            populate: {
                path: "users"
            }
        });
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

//Finds an active room if present, else creates a new active room
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
    //If active room is found
    if (room) {
        return res.json({ room: room.toObject({ getters: true }) });
    }
    //Else create active room
    room = await createChatRoom();
    if (!room) {
        const error = new HttpError(
            "Something went wrong, could not find the required matching room.",
            500
        );
        return next(error);
    }
    res.json({ room: room.toObject({ getters: true }) });
}

const createChatRoom = async (uid1, uid2) => {
    let user1, user2;
    try {
        user1 = await User.findById(uid1);
        user2 = await User.findById(uid2);
    } catch (err) {
        console.error(err);
        return;
    }

    if (!user1 || !user2) {
        console.error("Failed to get users");
    }
    const createdChat = new Chat({
        users: [uid1, uid2],
        messages: [],
    })
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdChat.save({ session: sess });
        user1.chats.push(createdChat);
        user2.chats.push(createdChat);
        await user1.save({ session: sess });
        await user2.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        console.error(err);
        return;
    }
    return createdChat.toObject({ getters: true });
}

exports.getAllChatRooms = getAllChatRooms;
exports.getChatRoomById = getChatRoomById;
exports.findMatchingRoom = findMatchingRoom;
