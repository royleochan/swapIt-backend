const HttpError = require("../models/http-error");
const Chat = require("../models/chat");
const Product = require("../models/product");
const User = require("../models/user");
const mongoose = require("mongoose");

const getAllChatRooms = async (req, res, next) => {
  const userId = req.params.uid;
  let rooms;
  let result;
  try {
    rooms = await User.findById(userId, "chats").populate({
      path: "chats",
      select: "users product messages updatedAt",
      populate: [
        {
          path: "product",
          select: "title imageUrl category minPrice maxPrice",
        },
        { path: "users", select: "profilePic username" },
        { path: "messages", select: "content createdAt" },
      ],
      options: { sort: { updatedAt: -1 } },
    });

    result = rooms.chats.map((chat) => {
      const numMessages = chat.messages.length;
      const hasMessage = numMessages >= 1;
      return {
        user: chat.users.find((usr) => usr.id !== userId),
        chatId: chat.id,
        product: chat.product,
        latestMessage: hasMessage ? chat.messages[numMessages - 1].content : "",
        updatedAt: chat.updatedAt,
      };
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not find the chat rooms.",
      500
    );
    return next(error);
  }
  if (!rooms) {
    const error = new HttpError(
      "Could not find chat room with the chat room id",
      404
    );
    return next(error);
  }
  res.json({ chats: result });
};

const getChatRoomById = async (req, res, next) => {
  const { rid } = req.params;
  let room;
  try {
    room = await Chat.findById(rid).populate([
      { path: "product" },
      { path: "users" },
      { path: "messages" },
    ]);
    if (!room) {
      const error = new HttpError(
        "Could not find chat room with the chat room id",
        404
      );
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
  const { pid, uid1, uid2 } = req.params;
  let user1, user2, room1, room2;
  try {
    user1 = await User.findById(uid1, "name username profilePic").populate({
      path: "chats",
      populate: [
        {
          path: "product",
          select: "title imageUrl category minPrice maxPrice",
        },
      ],
    });
    room1 = user1.chats.find((chat) => chat.product._id === pid);
    user2 = await User.findById(uid2, "name username profilePic").populate({
      path: "chats",
      populate: [
        {
          path: "product",
          select: "title imageUrl category minPrice maxPrice",
        },
      ],
    });
    room2 = user2.chats.find((chat) => chat.product._id === pid);
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
    room.users = [
      user1.toObject({ getters: true }),
      user2.toObject({ getters: true }),
    ];
    return res.json({ room: room });
  }
  //Else create active room
  let createdRoom;
  try {
    createdRoom = await createChatRoom(pid, user1, user2);
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
};

const createChatRoom = async (pid, user1, user2) => {
  if (!pid || !user1 || !user2) {
    console.error("No product id, or no users");
  }

  let product;
  try {
    product = await Product.findById(pid);
  } catch (err) {
    console.error(err);
    return;
  }
  const createdChat = new Chat({
    product: product._id,
    users: [user1._id, user2._id],
    messages: [],
    // lastSeen: [new Date(), new Date()],
  });

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
  result.product = product.toObject({ getters: true });
  result.users = [
    user1.toObject({ getters: true }),
    user2.toObject({ getters: true }),
  ];
  return result;
};

exports.getAllChatRooms = getAllChatRooms;
exports.getChatRoomById = getChatRoomById;
exports.findMatchingRoom = findMatchingRoom;
