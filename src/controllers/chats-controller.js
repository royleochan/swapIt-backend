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
            populate: [
                { path: "users" },
                { path: "messages" }
            ]
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
    const { rid } = req.params;
    let room;
    try {
        room = await Chat.findById(rid).populate("messages").populate("users");
        if (!room) {
            const error = new HttpError("Could not find chat room with the chat room id", 404);
            return next(error);
        }
        res.json({ room: room.toObject({ getters: true }) });
    } catch (err) {
        const error = new HttpError(
            "Something went wrong, could not find a chat room.",
            500
        );
        return next(error);
    }
};

//Finds an active room if present, else creates a new active room
const findMatchingRoom = async (req, res, next) => {
    const { uid1, uid2 } = req.params;
    let user1, user2, room1, room2;
    try {
        user1 = await User.findById(uid1).populate("chats");
        room1 = user1.chats.find(chat => chat.users.includes(uid2));
        user2 = await User.findById(uid2).populate("chats");
        room2 = user2.chats.find(chat => chat.users.includes(uid1));
    } catch (e) {
        console.error(e);
        const error = new HttpError(
            "Something went wrong, could not find the required matching room.",
            500
        );
        return next(error);
    }
    //If active room is found
    if (room1 || room2) {
        //If user2 has deleted the chat room
        if (room1 && !room2) {
            try {
                user2.chats.push(room1);
                await user2.save();
            } catch (err) {
                console.err(err);
                return;
            }
            //If user1 has deleted the chat room
        } else if (!room1) {
            try {
                user1.chats.push(room2);
                await user1.save();
            } catch (err) {
                console.err(err);
                return;
            }
        }

        let room = room1 ? room1 : room2;
        room = room.toObject({ getters: true });
        room.users = [user1.toObject({ getters: true }), user2.toObject({ getters: true })];
        return res.json({ room: room });
    }
    //Else create active room
    let createdRoom;
    try {
        createdRoom = await createChatRoom(uid1, uid2);
    } catch (e) {
        console.error(e);
    }
    if (!createdRoom) {
        const error = new HttpError(
            "Something went wrong, could not find the required matching room.",
            500
        );
        return next(error);
    }
    res.json({ room: createdRoom });
}

const createChatRoom = async (user1, user2) => {
    if (!user1 || !user2) {
        console.error("Failed to get users");
    }
    const createdChat = new Chat({
        users: [user1, user2],
        messages: [],
        // lastSeen: [new Date(), new Date()],
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

    const result = createdChat.toObject({ getters: true });
    result.users = [user1.toObject({ getters: true }), user2.toObject({ getters: true })];
    return result;
}

exports.getAllChatRooms = getAllChatRooms;
exports.getChatRoomById = getChatRoomById;
exports.findMatchingRoom = findMatchingRoom;
