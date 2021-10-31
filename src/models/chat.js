const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
    product: { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
    users: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    messages: [{ type: mongoose.Types.ObjectId, required: true, ref: "Message" }],
    // lastSeen: [{ type: Date, required: true }],
    },
    { timestamps: true });

module.exports = mongoose.model("Chat", chatRoomSchema);
