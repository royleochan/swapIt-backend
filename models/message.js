const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    content: { type: String, required: true },
    imageUrl: { type: String, required: true },
    date: { type: Date, required: true },
}, { timestamps: true});

module.exports = mongoose.model("Message", messageSchema);
