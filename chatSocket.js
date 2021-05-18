import uuid from "react-native-uuid";
import { REACT_APP_BACKEND_URL } from "@env";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Actions, GiftedChat } from "react-native-gifted-chat";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { Icon } from "react-native-elements";

import request from "utils/request";
import Colors from "constants/Colors";
import {
    takeImage,
    chooseFromLibrary,
    uploadImageHandler,
} from "utils/imagePicker";

const ChatScreen = (props) => {
    const [socket] = useState(
        io(`${REACT_APP_BACKEND_URL}/chatSocket`, {
            autoConnect: false,
        })
    );
    const [messages, setMessages] = useState([]);
    const [lastSentMessage, setLastSentMessage] = useState("");
    const [lastSentImageUrl, setLastSentImageUrl] = useState("");

    const loggedInUserId = useSelector((state) => state.auth.user.id);
    const userId = props.route.params._id;
    const userProfilePic = props.route.params.profilePic;

    const updateMessages = (userId, content, imageUrl) => {
        const newMessage = [
            {
                _id: uuid.v4(),
                text: content,
                image: imageUrl,
                createdAt: new Date(),
                user: {
                    _id: userId,
                    avatar: userProfilePic,
                },
            },
        ];
        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessage)
        );
    }

    const handleCancel = () => {};

    //Choose image from image library
    const handlePickImage = async () => {
        try {
            let img = await chooseFromLibrary();
            if (isValidImage(img)) {
                console.log("Uploading image...");
                let imageUrl = await uploadImageHandler(img);
                setValidImageUrl(imageUrl);
            } else {
                console.log("Image chosen is invalid!");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const isValidString = (inputString) => {
        return inputString !== "" && inputString !== undefined;
    };

    const isValidImage = (img) => {
        return img !== undefined;
    };

    const setValidImageUrl = (inputUrl) => {
        if (isValidString(inputUrl)) {
            setLastSentImageUrl(inputUrl);
        } else {
            console.log("Invalid Image Url:", inputUrl);
        }
    };

    const renderActions = (props) => {
        return (
            <Actions
                {...props}
                options={{
                    ["Use camera"]: takeImage,
                    ["Choose Image"]: handlePickImage,
                    ["Cancel"]: handleCancel,
                }}
                icon={() => (
                    <Icon name={"attachment"} size={23} color={Colors.primary} />
                )}
                onSend={(args) => console.log(args)}
            />
        );
    };

    const getMessages = async (roomId) => {
        //   const response = await request.get(`/api/chats/${loggedInUserId}/${userId}`);
        const response = await request.get(`/api/chats/${roomId}`);
        return response.data.room.messages.map((message) => {
            return {
                _id: message._id,
                text: message.content,
                image: message.imageUrl,
                createdAt: message.createdAt,
                user: {
                    _id: message.creator,
                    avatar: userProfilePic,
                },
            };
        });
    };

    useEffect(() => {
        // setIsLoading(true);
        console.log("Attempting to connect...");
        socket.connect();
        socket.on("connect", async () => {
            console.log("Received connect, preparing to emit...");
            socket.emit("join", "609a8094dec46a7ce23a5e61");
        });
        socket.on("joined", async (roomId) => {
            console.log("User has joined room %s", roomId);
            await getMessages(roomId)
                .then((response) => {
                    // setIsLoading(false);
                    setMessages(response.reverse());
                })
                .catch((e) => console.error(e));
        });
        socket.on("message", (message) => {
            const newMessage = [
                {
                    _id: uuid.v4(),
                    text: message.content,
                    image: message.imageUrl,
                    createdAt: new Date(),
                    user: {
                        _id: message.userId,
                        avatar: userProfilePic,
                    },
                },
            ];
            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, newMessage)
            );
        });
        return () => {
            console.log("DISCONNECT");
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isValidString(lastSentMessage)) {
            console.log("LAST SENT:" + lastSentMessage);
            socket.emit("message", {
                userId: loggedInUserId,
                message: lastSentMessage,
                imageUrl: "",
            });
        } else {
            console.log("Invalid message");
        }
    }, [lastSentMessage]);

    useEffect(() => {
        if (isValidString(lastSentImageUrl)) {
            console.log("LAST SENT:" + lastSentImageUrl);
            socket.emit("message", {
                userId: loggedInUserId,
                message: "",
                imageUrl: lastSentImageUrl,
            });
            updateMessages(loggedInUserId, "", lastSentImageUrl);
        } else {
            console.log("Invalid Image Url");
        }
    }, [lastSentImageUrl]);

    const onSend = useCallback((newMessage = []) => {
        console.log(newMessage[0]);
        setLastSentMessage(newMessage[0].text);
        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessage)
        );
    }, []);

    return (
        <GiftedChat
            messages={messages}
            onSend={(messages) => onSend(messages)}
            user={{
                _id: loggedInUserId,
            }}
            renderActions={renderActions}
            infiniteScroll
        />
    );
};

export default ChatScreen;
