//----  External Imports ----//
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

//----  Services Imports ----//
const sendPushNotification = require("../services/pushNotification");

//----  Models Imports ----//
const HttpError = require("../models/http-error");
const Like = require("../models/like");
const Match = require("../models/match");
const Product = require("../models/product");
const User = require("../models/user");
const Notification = require("../models/notification");

//----  Other Imports ----//
const productPipeline = require("../controllers/pipelines/products-search");

//----  Controllers ----//
const getProductById = async (req, res, next) => {
  const { pid } = req.params;

  try {
    const product = await Product.findById(pid).populate({
      path: "matches creator",
      select: "match product username",
      populate: {
        path: "product match",
        select: "-likes -matches -category -description -createdAt -updatedAt",
        populate: {
          path: "creator",
          select: "username",
        },
      },
    });

    if (!product) {
      const error = new HttpError("Could not find product for product id", 404);
      return next(error);
    }

    res.json({
      product: product.toObject({ getters: true }),
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not fetch product", 500);
    return next(error);
  }
};

const getProductsByUserId = async (req, res, next) => {
  const { uid } = req.params;

  let userWithProducts;
  try {
    userWithProducts = await User.findById(uid).populate({
      path: "products",
      populate: { path: "creator" },
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithProducts) {
    const error = new HttpError("Could not find products for user id", 404);
    return next(error);
  }

  res.json({
    products: userWithProducts.products.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

const getAllFollowingProducts = async (req, res, next) => {
  const { uid } = req.params;

  let following;
  let followingProducts;
  try {
    following = await User.findById(uid, "following").populate({
      path: "following",
      select: "products -_id",
      populate: {
        path: "products",
        match: { isSwapped: false },
        populate: { path: "creator" },
      },
    });
    followingProducts = following.following
      .map((user) => user.products)
      .flat()
      .sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching products failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!followingProducts || !following) {
    const error = new HttpError("Could not find any products.", 404);
    return next(error);
  }

  res.status(200).json({
    products: followingProducts.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

const getCategoryProducts = async (req, res, next) => {
  const { filterCategory } = req.params;

  let productsByCategory;
  try {
    productsByCategory = await Product.find({
      isSwapped: false,
      category: filterCategory,
    }).populate("creator");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching products failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!productsByCategory) {
    const error = new HttpError("No products found in this category.", 404);
    return next(error);
  }

  res.status(200).json({
    products: productsByCategory,
  });
};

const getLikedProducts = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithLikes;
  try {
    userWithLikes = await User.findById(userId).populate({
      path: "likes",
      select: "productId",
      populate: { path: "productId", populate: { path: "creator" } },
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching liked products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithLikes) {
    const error = new HttpError(
      "Could not find liked products for user id",
      404
    );
    return next(error);
  }

  res.json({
    data: userWithLikes.likes.map((likedProduct) =>
      likedProduct.productId.toObject({ getters: true })
    ),
  });
};

const searchForProducts = async (req, res, next) => {
  const { query } = req.query;
  productPipeline[0].$search.text.query = query;

  const searchedProducts = [];
  if (query.length > 0) {
    let aggCursor;
    try {
      aggCursor = await Product.aggregate(productPipeline);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching products failed, please try again later",
        500
      );
      return next(error);
    }

    aggCursor.forEach((product) => searchedProducts.push(product));
  }

  if (!searchedProducts) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: searchedProducts.map((product) => {
      return { ...product, id: product._id };
    }),
  });
};

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const {
    title,
    imageUrl,
    description,
    minPrice,
    maxPrice,
    creator,
    category,
  } = req.body;

  const createdProduct = new Product({
    title,
    imageUrl,
    description,
    minPrice,
    maxPrice,
    creator,
    category,
    likes: [],
    matches: [],
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating product failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProduct.save({ session: sess });
    user.products.push(createdProduct);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to create product, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ product: createdProduct.toObject({ getters: true }) });
};

const updateProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { title, description, imageUrl, category } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not find the product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find product.", 404);
    return next(error);
  }

  if (product.isSwapped) {
    const error = new HttpError("Cannot edit swapped product.", 400);
    return next(error);
  }

  product.title = title;
  product.description = description;
  product.imageUrl = imageUrl;
  product.category = category;

  try {
    await product.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update the product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ product: product.toObject({ getters: true }) });
};

const deleteProduct = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId).populate("creator");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find product for this id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    if (product.isSwapped) {
      // only set flag to deleted
      product.isDeleted = true;
      await product.save({ session: sess });

      // remove productId from products array in creator
      product.creator.products.pull(product);
      await product.creator.save({ session: sess });

      // remove productId from likes array for all users who liked the product
      const likesToRemove = await Like.find(
        { productId: productId },
        "userId"
      ).populate({ path: "userId", select: "likes" });
      const likeIdToRemove = likesToRemove[0]._id.toString();
      const usersToUpdate = likesToRemove.map((data) => data.userId);
      for (const user of usersToUpdate) {
        user.likes = user.likes.filter(
          (likeId) => likeId.toString() !== likeIdToRemove
        );
        await user.save({ session: sess });
      }
    } else {
      // delete product completely from collection
      await product.deleteOne({ session: sess });

      // delete associated matches
      await Match.deleteMany(
        {
          $or: [{ productOneId: productId }, { productTwoId: productId }],
        },
        { session: sess }
      );

      const productsToUpdate = await Product.find({
        "matches.product": productId,
      });
      for (const product of productsToUpdate) {
        product.matches = product.matches.filter(
          (match) => match.product.toString() !== productId
        );
        await product.save({ session: sess });
      }

      // delete associated notifications & remove like from all users who like the product
      // need to use Map to avoid transaction write conflicts
      let usersToUpdate = [];
      const usersToUpdateLikes = new Map();
      const usersToUpdateNotifications = new Map();
      const usersToUpdateBoth = new Map();

      const notificationsToRemove = await Notification.find({
        $or: [{ productId: productId }, { matchedProductId: productId }],
      });
      for (const notification of notificationsToRemove) {
        const notificationId = this._id;
        usersToUpdate = await User.find({
          notifications: notificationId,
        });
        for (const user of usersToUpdate) {
          usersToUpdateNotifications.set(user._id.toString(), [
            user,
            notificationId,
          ]);
        }

        await notification.deleteOne({ session: sess });
      }

      usersToUpdate = await User.find({ likes: productId });

      for (const user of usersToUpdate) {
        const userId = user._id.toString();
        if (usersToUpdateNotifications.has(userId)) {
          usersToUpdateBoth.set(
            user._id.toString(),
            usersToUpdateNotifications.get(userId)
          );

          usersToUpdateNotifications.delete(userId);
        } else {
          usersToUpdateLikes.set(user._id.toString(), user);
        }
      }

      const productCreatorId = product.creator._id.toString();

      for (const [uid, user] of usersToUpdateLikes) {
        if (uid === productCreatorId) {
          user.products.pull(product);
        }

        user.likes = user.likes.filter((pid) => pid.toString() !== productId);
        await user.save({ session: sess });
      }

      for (const [uid, data] of usersToUpdateNotifications) {
        const [user, notificationId] = [data];

        if (uid === productCreatorId) {
          user.products.pull(product);
        }

        user.notifications = user.notifications.filter(
          (nid) => nid.toString() !== notificationId.toString()
        );
        await user.save({ session: sess });
      }

      for (const [uid, data] of usersToUpdateBoth) {
        const [user, notificationId] = data;

        if (uid === productCreatorId) {
          user.products.pull(product);
        }

        user.notifications = user.notifications.filter(
          (nid) => nid.toString() !== notificationId.toString()
        );
        user.likes = user.likes.filter((pid) => pid.toString() !== productId);
        await user.save({ session: sess });
      }

      // remove productId from products array in creator
      if (
        !usersToUpdateLikes.has(productCreatorId) &&
        !usersToUpdateNotifications.has(productCreatorId) &&
        !usersToUpdateBoth.has(productCreatorId)
      ) {
        product.creator.products.pull(product);
        await product.creator.save({ session: sess });
      }
    }
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Product" });
};

const likeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // find product and product creator
    let product;
    try {
      product = await Product.findById(productId).populate("creator");
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Something went wrong, could not find product.",
        500
      );
      return next(error);
    }

    if (!product) {
      const error = new HttpError("Could not find product for this id.", 404);
      return next(error);
    }

    if (product.isSwapped) {
      const error = new HttpError(
        "Cannot like item that has already been swapped.",
        400
      );
      return next(error);
    }

    // find user
    let user;
    try {
      user = await User.findById(userId);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, please try again later.",
        500
      );
      return next(error);
    }

    if (!user) {
      const error = new HttpError("Could not find logged in user", 404);
      return next(error);
    }

    // check if item has already been liked
    let likeToFind;
    try {
      likeToFind = await Like.find({ userId: userId, productId: productId });
      if (likeToFind.length >= 1) {
        const error = new HttpError("Already liked item.", 400);
        return next(error);
      }
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Something went wrong, please try again later.",
        500
      );
      return next(error);
    }

    // create like document and push to product and user arrays
    try {
      const newLike = await new Like({
        productId: productId,
        userId: userId,
      }).save({ session: sess });
      product.likes.push(newLike);
      user.likes.push(newLike);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Failed to like item, please try again later.",
        500
      );
      return next(error);
    }

    // check for matches
    let creator;
    try {
      creator = await User.findById(
        product.creator,
        "likes pushToken notifications"
      ).populate({
        path: "likes",
        select: "productId",
        populate: {
          path: "productId",
          select: "minPrice maxPrice allowance creator matches title isSwapped",
        },
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, please try again later.",
        500
      );
      return next(error);
    }

    if (!creator) {
      const error = new HttpError("Could not find product creator.", 404);
      return next(error);
    }

    const mappedProducts = creator.likes.map((item) => item.productId);
    const matchedItems = mappedProducts
      .filter((item) => {
        return (
          item.creator.toString() === user._id.toString() && !item.isSwapped
        );
      })
      .filter((item) => {
        const prices = [
          [item.minPrice, item.maxPrice],
          [product.minPrice, product.maxPrice],
        ];
        prices.sort((a, b) => a[0] - b[0]);

        return prices[1][0] <= prices[0][1];
      });

    // if there is a match
    if (matchedItems.length !== 0) {
      try {
        for (i = 0; i < matchedItems.length; i++) {
          const newMatch = new Match({
            productOneId: product._id,
            productTwoId: matchedItems[i]._id,
          });
          await newMatch.save({ session: sess });
          product.matches.push({
            match: newMatch._id,
            product: matchedItems[i]._id,
          });
          matchedItems[i].matches.push({
            match: newMatch._id,
            product: product._id,
          });
          await matchedItems[i].save({ session: sess });
        }
      } catch (err) {
        console.log(err);
        const error = new HttpError(
          "Something went wrong, could not successfully save matches.",
          500
        );
        return next(error);
      }
    }

    // NOTIFICATIONS //
    let notificationsToSendToOtherUser = []; // array of functions
    let notificationsToSendToOwnself = []; // array of functions

    // Create Notification For Like
    let notification;
    const { pushToken } = creator;
    notificationsToSendToOtherUser.push(
      async () =>
        await sendPushNotification(
          pushToken,
          "New Like",
          `${user.name} liked your ${product.title}`
        )
    );
    notification = new Notification({
      creator: userId,
      targetUser: creator._id,
      productId: product._id,
      description: `${user.name} liked your ${product.title}`,
      type: "LIKE",
      isRead: false,
    });
    await notification.save({ session: sess });
    creator.notifications.push(notification._id);

    // Create Notification(s) For Matches: both ways
    for (let i = 0; i < matchedItems.length; i++) {
      // To other user
      notificationsToSendToOtherUser.push(
        async () =>
          await sendPushNotification(
            pushToken,
            "New Match",
            `${matchedItems[i].title} matched with your ${product.title}`
          )
      );

      notification = new Notification({
        creator: userId,
        targetUser: creator._id,
        productId: product._id,
        matchedProductId: matchedItems[i]._id,
        description: `${matchedItems[i].title} matched with your ${product.title}`,
        type: "MATCH",
        isRead: false,
      });
      await notification.save({ session: sess });
      creator.notifications.push(notification._id);

      // To ownself
      notificationsToSendToOwnself.push(
        async () =>
          await sendPushNotification(
            user.pushToken,
            "New Match",
            `${product.title} matched with your ${matchedItems[i].title}`
          )
      );
      notification = new Notification({
        creator: creator._id,
        targetUser: userId,
        productId: matchedItems[i]._id,
        matchedProductId: product._id,
        description: `${product.title} matched with your ${matchedItems[i].title}`,
        type: "MATCH",
        isRead: false,
      });
      await notification.save({ session: sess });
      user.notifications.push(notification._id);
    }

    await creator.save({ session: sess });
    await product.save({ session: sess });
    await user.save({ session: sess });
    await sess.commitTransaction();

    // Send Notifications to other user: can fail
    try {
      if (notificationsToSendToOtherUser.length >= 4) {
        await sendPushNotification(
          pushToken,
          "New Notifications",
          `You have ${notificationsToSendToOtherUser.length} new notifications.`
        );
      } else {
        for (fn of notificationsToSendToOtherUser) {
          await fn();
        }
      }
    } catch (err) {
      console.log(err);
    }

    // Send Notifications to ownself: can fail
    try {
      if (notificationsToSendToOwnself.length >= 4) {
        await sendPushNotification(
          user.pushToken,
          "New Notifications",
          `You have ${notificationsToSendToOwnself.length} new notifications.`
        );
      } else {
        for (fn of notificationsToSendToOwnself) {
          await fn();
        }
      }
    } catch (err) {
      console.log(err);
    }

    res.status(200).json({
      message: "Liked Product",
      product: product.toObject({ getters: true }),
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }
};

const unlikeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // find like document and delete it
    let likeToFind;
    try {
      likeToFind = await Like.findOne({ userId: userId, productId: productId });
      if (!likeToFind) {
        const error = new HttpError(
          "Cannot unlike item that you have not liked yet, please try again later.",
          404
        );
        return next(error);
      } else {
        await likeToFind.deleteOne({ session: sess });
      }
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Something went wrong, please try again later.",
        500
      );
      return next(error);
    }

    // find product that has been unliked and filter away all matches with the user's items
    let product;
    try {
      product = await Product.findById(productId).populate({
        path: "matches",
        populate: {
          path: "product",
        },
      });

      if (product.isSwapped) {
        const error = new HttpError(
          "Cannot unlike product that has already been swapped",
          400
        );
        return next(error);
      }

      // remove matches from the matches collection
      let unmatchedProductsMatches;
      unmatchedProductsMatches = product.matches.filter(
        (match) => match.product.creator.toString() === userId.toString()
      );
      for (let i = 0; i < unmatchedProductsMatches.length; i++) {
        let matchToDelete = await Match.findById(
          unmatchedProductsMatches[i].match
        );
        await matchToDelete.deleteOne({ session: sess });
      }

      // remove relevant matchIds from matches array of unliked product
      let newMatchedProductsMatches;
      newMatchedProductsMatches = product.matches.filter(
        (match) => match.product.creator.toString() !== userId.toString()
      );
      product.matches = newMatchedProductsMatches;

      // remove like from likes array of the unliked product
      product.likes.pull(likeToFind);
      await product.save({ session: sess });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Unliking product failed", 500);
      return next(error);
    }

    if (!product) {
      const error = new HttpError("Could not find product for this id", 404);
      return next(error);
    }

    // find user who unliked the product and remove all matches of his products with unliked product
    let user;
    try {
      user = await User.findById(userId).populate("products", {
        matches: 1,
      });
      for (i = 0; i < user.products.length; i++) {
        let newMatchedProductsMatches = user.products[i].matches.filter(
          (match) => match.product.toString() !== productId.toString()
        );
        user.products[i].matches = newMatchedProductsMatches;
        try {
          await user.products[i].save({ session: sess });
        } catch (err) {
          console.log(err);
          const error = new HttpError(
            "Could not unmatch item, please try again later",
            500
          );
          return next(error);
        }
      }

      // remove like id from user likes array
      user.likes.pull(likeToFind);

      await user.save({ session: sess });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, please try again later",
        500
      );
      return next(error);
    }

    if (!user) {
      const error = new HttpError("Could not find user for this user id", 404);
      return next(error);
    }

    res.status(200).json({
      message: "Unliked Product",
      product: product.toObject({ getters: true }),
    });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }
};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.getAllFollowingProducts = getAllFollowingProducts;
exports.getCategoryProducts = getCategoryProducts;
exports.searchForProducts = searchForProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.likeProduct = likeProduct;
exports.unlikeProduct = unlikeProduct;
exports.getLikedProducts = getLikedProducts;
