const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    content: { type: String, required: () => this.imageUrl === "" },
    imageUrl: { type: String },
    seen: { type: Boolean, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
