const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const sendPushNotification = require("../services/pushNotification");
const HttpError = require("../models/http-error");
const Match = require("../models/match");
const Product = require("../models/product");
const User = require("../models/user");
const Notification = require("../models/notification");
const productPipeline = require("../controllers/pipelines/products-search");

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

    res.json({
      product: product.toObject({ getters: true }),
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not find product for product id", 404);
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

  if (!userWithProducts || userWithProducts.products.length === 0) {
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

  if (!followingProducts) {
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

const searchForProducts = async (req, res, next) => {
  const query = req.params.query;
  productPipeline[0].$search.text.query = query;

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

  const searchedProducts = [];
  aggCursor.forEach((product) => searchedProducts.push(product));

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
    await product.remove({ session: sess });
    product.creator.products.pull(product);
    await product.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch {
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
      const error = new HttpError("Could not find product for this id", 404);
      return next(error);
    }

    // find user
    let user;
    try {
      user = await User.findById(userId);
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, please try again later",
        500
      );
      return next(error);
    }

    if (!product.likes.includes(userId)) {
      product.likes.push(userId);
      user.likes.push(product._id);
    } else {
      const error = new HttpError("Already liked item", 400);
      return next(error);
    }

    if (!user) {
      const error = new HttpError("Could not find logged in user", 404);
      return next(error);
    }

    let creator;
    try {
      creator = await User.findById(product.creator).populate("likes", {
        minPrice: 1,
        maxPrice: 1,
        allowance: 1,
        creator: 1,
        matches: 1,
        title: 1,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Fetching user failed, please try again later",
        500
      );
      return next(error);
    }

    if (!creator) {
      const error = new HttpError("Could not find product creator", 404);
      return next(error);
    }

    // check for matches
    const matchedItems = creator.likes
      .filter((item) => {
        return item.creator.toString() === user._id.toString();
      })
      .filter((item) => {
        return (
          item.minPrice <= product.maxPrice || product.minPrice <= item.maxPrice
        );
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

    // Send Notification For Like
    let notification;
    const { pushToken } = creator;
    await sendPushNotification(
      pushToken,
      "New Like",
      `${user.name} liked your ${product.title}`
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

    // Send Notification(s) For Matches: both ways
    for (let i = 0; i < matchedItems.length; i++) {
      // To other user
      await sendPushNotification(
        pushToken,
        "New Match",
        `${matchedItems[i].title} matched with your ${product.title}`
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
      await sendPushNotification(
        user.pushToken,
        "New Match",
        `${product.title} matched with your ${matchedItems[i].title}`
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

    // find product that has been unliked and filter away all matches with the user's items
    let product;
    try {
      product = await Product.findById(productId)
        .populate("creator")
        .populate({
          path: "matches",
          populate: {
            path: "product",
          },
        });

      // remove matches from the matches collection
      let unmatchedProductsMatches;
      unmatchedProductsMatches = product.matches.filter(
        (obj) => obj.product.creator.toString() === userId.toString()
      );
      for (let i = 0; i < unmatchedProductsMatches.length; i++) {
        let matchToDelete = await Match.findById(
          unmatchedProductsMatches[i].match
        );
        await matchToDelete.remove({ session: sess });
      }

      let newMatchedProductsMatches;
      newMatchedProductsMatches = product.matches.filter(
        (match) => match.product.creator.toString() !== userId.toString()
      );
      product.matches = newMatchedProductsMatches;
    } catch (err) {
      console.log(err);
      const error = new HttpError("Fetching product failed", 500);
      return next(error);
    }

    if (!product) {
      const error = new HttpError("Could not find product for this id", 404);
      return next(error);
    }

    // remove userId from likes array of the unliked product
    product.likes.pull(userId);

    // find user who unliked the product and remove all matches of his products with unliked product
    let user;
    try {
      user = await User.findById(userId).populate("products", {
        matches: 1,
      });
      // remove product id from user likes array
      user.likes.pull(product._id);
      for (i = 0; i < user.products.length; i++) {
        let newMatchedProductsMatches = user.products[i].matches.filter(
          (match) => match.product.toString() !== productId.toString()
        );
        user.products[i].matches = newMatchedProductsMatches;
        try {
          await user.products[i].save();
        } catch (err) {
          console.log(err);
          const error = new HttpError(
            "Could not unmatch item, please try again later",
            500
          );
          return next(error);
        }
      }
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

    try {
      await product.save();
      await user.save();
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Could not unlike item, please try again later",
        500
      );
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

const getLikedProducts = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithLikes;
  try {
    userWithLikes = await User.findById(userId).populate("likes");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching liked products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithLikes || userWithLikes.likes.length === 0) {
    const error = new HttpError(
      "Could not find liked products for user id",
      404
    );
    return next(error);
  }

  res.json({
    data: userWithLikes.likes.map((likedProduct) =>
      likedProduct.toObject({ getters: true })
    ),
  });
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
