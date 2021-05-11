const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
    users: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    messages: [{ type: mongoose.Types.ObjectId, required: true, ref: "Message" }],
});

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
