//----  Models Imports ----//
const HttpError = require("../models/http-error");
const Like = require("../models/like");
const Review = require("../models/review");
const View = require("../models/view");
const Match = require("../models/match");
const User = require("../models/user");
const {generateEuclideanScore} = require("../utils/recommender");

// Reference algorithm: https://becominghuman.ai/introduction-to-recommendation-system-in-javascript-74209c7ff2f7

const getRecommendedUsers = async (req, res, next) => {
    const {uid} = req.params;
    try {
        const data = {}

        // Items you viewed: Multiplier = 1
        const view_objs = await View.find({}, ["productId", "userId"])
        for (var obj of view_objs) {
            if (!(obj.userId in data)) {
                data[obj.userId] = {}
                data[obj.userId][obj.productId] = 1
            }
        }

        // Items you like: Multipler = 2
        const like_objs = await Like.find({}, ["productId", "userId"])
        for (var obj of like_objs) {
            if (!(obj.userId in data)) {
                data[obj.userId] = {}
                data[obj.userId][obj.productId] = 2
            }
        }

        // Items you matched: Multiplier = 3 (Match should include user)
        // Item you reviewed: Review score (Review score only tagged to user, not product?)

        // Do for all users to get user similarity score
        if (!Object.keys(data).includes(uid)) {
            // Need to handle case where no user interactions to generate recommendations
            res.json("Insufficient data to generate recommendations");
        } else {
            scores = {}
            for (var user of Object.keys(data)) {
                if (uid !== user) {
                    scores[user] = generateEuclideanScore(data, uid, user)
                }
            }
            res.json(scores)
            // Need to handle case where scores empty or all values in scores is 0
        }

    } catch (err) {
        console.log(err);
        const error = new HttpError(
            "Could not generate recommended products.",
            404
        );
        return next(error);
    }
};

exports.getRecommendedUsers = getRecommendedUsers;