const Chat = require("../models/chat");

const newChat = (req, res, next) => {
  const query = Chat.findOne({
    $or: [
      { receiver: req.body.receiver, sender: req.body.sender },
      { receiver: req.body.sender, sender: req.body.receiver },
    ],
  });
  query
    .exec()
    .then((data) => {
      if (data === null) {
        const chat = new Chat({
          sender: req.body.sender,
          receiver: req.body.receiver,
          messages: req.body.messages,
        });

        chat
          .save()
          .then((data) => {
            res.json(data);
          })
          .catch((error) => {
            res.json(error);
          });
      } else {
        const updateChat = Chat.updateOne(
          {
            $or: [
              { receiver: req.body.receiver, sender: req.body.sender },
              { receiver: req.body.sender, sender: req.body.receiver },
            ],
          },
          { $set: { messages: req.body.messages } }
        );
        updateChat
          .exec()
          .then((data) => {
            res.json(data);
          })
          .catch((error) => {
            res.json(error);
          });
      }
    })
    .catch((error) => {
      res.json(error);
    });
};

const getMessages = (req, res, next) => {
  const chat = Chat.findOne({
    $or: [
      { receiver: req.params.receiver, sender: req.params.sender },
      { receiver: req.params.sender, sender: req.params.receiver },
    ],
  });

  chat.exec().then((data) => {
    if (data === null) {
      res.json([]);
    } else {
      res.json(data.messages);
    }
  });
};

const getChatRooms = (req, res, next) => {
  const chat = Chat.find({
    $or: [{ receiver: req.params.userId }, { sender: req.params.userId }],
  })
    .populate("receiver", { name: 1, profilePic: 1 })
    .populate("sender", { name: 1, profilePic: 1 });

  chat.exec().then((data) => {
    if (data.length === 0) {
      res.json([]);
    } else {
      res.json(data);
    }
  });
};

exports.newChat = newChat;
exports.getMessages = getMessages;
exports.getChatRooms = getChatRooms;
