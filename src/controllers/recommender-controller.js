//----  Models Imports ----//
const HttpError = require("../models/http-error");
const Like = require("../models/like");
const Review = require("../models/review");
const View = require("../models/view");
const Match = require("../models/match");
const User = require("../models/user");
const { generateEuclideanScore } = require("../utils/recommender");

// Reference algorithm: https://becominghuman.ai/introduction-to-recommendation-system-in-javascript-74209c7ff2f7

const getRecommendedUsers = async (req, res, next) => {
  const { uid } = req.params;
  try {
    const data = {};

    // Items you viewed: Multiplier = 1
    const view_objs = await View.find({}, ["productId", "userId"]);
    for (var obj of view_objs) {
      if (!(obj.userId in data)) {
        data[obj.userId] = {};
        data[obj.userId][obj.productId] = 1;
      }
    }

    // Items you like: Multipler = 2
    const like_objs = await Like.find({}, ["productId", "userId"]);
    for (var obj of like_objs) {
      if (!(obj.userId in data)) {
        data[obj.userId] = {};
        data[obj.userId][obj.productId] = 2;
      }
    }

    // Have not add query due to lack of data
    // Items you matched: Multiplier = 3
    //         for (var obj of matched_objs) {
    //             if (!(obj.userId in data)) {
    //                 data[obj.userId] = {}
    //                 data[obj.userId][obj.productId] = 3
    //             }
    //         }

    // Have not add query due to lack of data
    // Item you reviewed: Review score
    //         for (var obj of matched_objs) {
    //             if (!(obj.userId in data)) {
    //                 data[obj.userId] = {}
    //                 data[obj.userId][obj.productId] = obj.score
    //             }
    //         }

    scores = {};
    // If has user interaction, use to get user similarity scores and add to score object
    if (Object.keys(data).includes(uid)) {
      for (var user of Object.keys(data)) {
        if (uid != user) {
          score = generateEuclideanScore(data, uid, user);
          if (score !== 0) scores[user] = score;
        }
      }
    }

    // Get followings of followings, add 0.1 for each of these users to similarity score
    const following_objs = await User.findById(uid, "following").populate({
      path: "following",
      select: "following",
    });
    const user_objs = following_objs.following.flatMap((x) => x.following);
    for (var user of user_objs) {
      if (uid != user) {
        if (!(user in scores)) {
          scores[user] = 0.1;
        } else {
          scores[user] += 0.1;
        }
      }
    }

    // Remove already following users from output
    const following = await User.findById(uid, "following");
    const filter_id = following.following;
    const filtered_scores = Object.keys(scores)
      .filter((key) => !filter_id.includes(key))
      .reduce((obj, key) => {
        obj[key] = scores[key];
        return obj;
      }, {});

    // Top 20 similar users
    const top_20_similar = Object.keys(filtered_scores)
      .sort((x, y) => filtered_scores[y] - filtered_scores[x])
      .slice(0, 20);

    // Get most popular users
    const user_followers = await User.aggregate([
      { $project: { followers: { $size: "$followers" } } },
      { $sort: { followers: -1 } },
    ]);
    // Fill up remainder of recommended users with users with most followers
    // Filter away users that already following or already in the similarity array
    while (top_20_similar.length <= 20 && user_followers.length > 0) {
      const ele = user_followers.shift()._id.toString();
      if (!filter_id.includes(ele) && !top_20_similar.includes(ele)) {
        top_20_similar.push(ele);
      }
    }
    res.json(top_20_similar);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not generate recommended users.", 404);
    return next(error);
  }
};

const getRecommendedProducts = async (req, res, next) => {
  const { uid } = req.params;
  try {
    const data = {};

    // Items you viewed: Multiplier = 1
    const view_objs = await View.find({}, ["productId", "userId"]);
    for (var obj of view_objs) {
      if (!(obj.userId in data)) {
        data[obj.userId] = {};
        data[obj.userId][obj.productId] = 1;
      }
    }

    // Items you like: Multipler = 2
    const like_objs = await Like.find({}, ["productId", "userId"]);
    for (var obj of like_objs) {
      if (!(obj.userId in data)) {
        data[obj.userId] = {};
        data[obj.userId][obj.productId] = 2;
      }
    }

    // Have not add query due to lack of data
    // Items you matched: Multiplier = 3
    //         for (var obj of matched_objs) {
    //             if (!(obj.userId in data)) {
    //                 data[obj.userId] = {}
    //                 data[obj.userId][obj.productId] = 3
    //             }
    //         }

    // Have not add query due to lack of data
    // Item you reviewed: Review score
    //         for (var obj of matched_objs) {
    //             if (!(obj.userId in data)) {
    //                 data[obj.userId] = {}
    //                 data[obj.userId][obj.productId] = obj.score
    //             }
    //         }

    scores = {};
    // If has user interaction, use to get user similarity scores and add to score object
    if (Object.keys(data).includes(uid)) {
      for (var user of Object.keys(data)) {
        if (uid != user) {
          score = generateEuclideanScore(data, uid, user);
          if (score !== 0) scores[user] = score;
        }
      }
    }
    // Give following users a minimum similarity score of 0.5
    const following = await User.findById(uid, "following");
    const filter_id = following.following;
    for (var user of filter_id) {
      if (user in scores) {
        scores[user] = Math.max(0.5, scores[user]);
      } else {
        scores[user] = 0.5;
      }
    }

    // For each item, item score = sum of user similarity + item interaction weight
    item_scores = {};
    for (var user of Object.keys(scores)) {
      if (user in data) {
        for (var item in data[user]) {
          if (!(item in item_scores)) {
            item_scores[item] = 0;
          }
          item_scores[item] += scores[user] * data[user][item];
        }
      }
    }

    // Get top 20 item by item score
    const top_20_similar = Object.keys(item_scores)
      .sort((x, y) => item_scores[y] - item_scores[x])
      .slice(0, 20);
    res.json(top_20_similar);
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
exports.getRecommendedProducts = getRecommendedProducts;
