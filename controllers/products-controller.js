const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");

const HttpError = require("../models/http-error");
const Product = require("../models/product");
const User = require("../models/user");
const Notification = require("../models/notification");
const productPipeline = require("../controllers/pipelines/products-search");

// Create a new Expo SDK client
let expo = new Expo();

// read product by product id
const getProductById = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find product for product id", 404);
    return next(error);
  }

  res.json({ product: product.toObject({ getters: true }) });
};

// read products/product by user id
const getProductsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithProducts;
  try {
    userWithProducts = await User.findById(userId).populate({
      path: "products",
      populate: "creator",
    });
  } catch (err) {
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

// read products/product by user id
const getAllProducts = async (req, res, next) => {
  const userId = req.params.uid;

  let availableProducts;
  let availableProductsExcludingLikes;
  try {
    availableProducts = await Product.find({ creator: { $ne: userId } });
    availableProductsExcludingLikes = availableProducts.filter(
      (product) => product.likes.indexOf(userId) === -1
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (
    !availableProductsExcludingLikes ||
    availableProductsExcludingLikes.length === 0
  ) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: availableProductsExcludingLikes.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

const getMatchedProducts = async (req, res, next) => {
  const prodId = req.params.pid;

  let matchedProducts;
  try {
    matchedProducts = await Product.findById(prodId).populate("matches");
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching matches failed, please try again later",
      500
    );
    return next(error);
  }
  if (!matchedProducts.matches || matchedProducts.matches.length === 0) {
    const error = new HttpError("Could not find any matches", 404);
    return next(error);
  }

  res.status(200).json({
    data: matchedProducts.matches.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

// search for products
const searchForProducts = async (req, res, next) => {
  const query = req.params.query;
  productPipeline[0].$search.text.query = query;

  let aggCursor;
  try {
    aggCursor = await Product.aggregate(productPipeline);
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  const searchedProducts = [];
  aggCursor.forEach((product) => searchedProducts.push(product));

  if (searchedProducts.length === 0) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: searchedProducts,
  });
};

// create product
const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const {
    title,
    imageUrl,
    description,
    price,
    allowance,
    creator,
    category,
  } = req.body;

  const createdProduct = new Product({
    title,
    imageUrl,
    description,
    allowance,
    price,
    creator,
    category,
    likes: [],
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating product failed, please try again",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
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
    const error = new HttpError(
      "Failed to create product, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ product: createdProduct.toObject({ getters: true }) });
};

// update product
const updateProduct = async (req, res, next) => {
  const { title, description, price, allowance, imageUrl } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a product.",
      500
    );
    return next(error);
  }

  product.title = title;
  product.description = description;
  product.price = price;
  product.allowance = allowance;
  product.imageUrl = imageUrl;

  try {
    await product.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update a product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ product: product.toObject({ getters: true }) });
};

// delete product
const deleteProduct = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId).populate("creator");
  } catch (err) {
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
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Product" });
};

// like product
const likeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  // find product
  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
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

  product.likes.push(userId);

  // find user
  let user;
  try {
    user = await User.findById(userId);
    user.likes.push(product._id);
  } catch (err) {
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

  let notificationTitle = "New Like";
  let notificationBody = `${user.name} has liked your ${product.title}`;

  // create like notification
  let createdNotification = new Notification({
    title: notificationTitle,
    body: notificationBody,
    creator: user.id,
    notified: product.creator,
    product: product,
  });

  console.log(createdNotification);

  let creator;
  try {
    creator = await User.findById(product.creator).populate("likes", {
      price: 1,
      allowance: 1,
      creator: 1,
      matches: 1,
      title: 1,
    });
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later",
      500
    );
    return next(error);
  }

  if (!creator) {
    const error = new HttpError("Could not find user for this user id", 404);
    return next(error);
  }

  // Save the like notification
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdNotification.save({ session: sess });
    creator.notifications.push(createdNotification);
    await creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to send like notification, please try again.",
      500
    );
    return next(error);
  }

  // Send the like notification
  let notifications = [];

  const notification = {
    to: creator.pushToken,
    sound: "default",
    title: notificationTitle,
    body: notificationBody,
  };

  notifications.push(notification);

  let chunks = expo.chunkPushNotifications(notifications);
  let tickets = [];
  try {
    let ticketChunk = await expo.sendPushNotificationsAsync(chunks[0]);
    console.log(ticketChunk);
    tickets.push(...ticketChunk);
  } catch (err) {
    console.log(err);
  }

  // check for matches
  const matchedItems = creator.likes
    .filter((item) => {
      return item.creator.toString() === user._id.toString();
    })
    .filter((item) => {
      const prodMinPrice = product.price - product.allowance;
      const prodMaxPrice = product.price + product.allowance;
      const itemMinPrice = item.price - item.allowance;
      const itemMaxPrice = item.price + item.allowance;
      return (
        (product.price >= itemMinPrice && product.price <= itemMaxPrice) ||
        (item.price >= prodMinPrice && item.price <= prodMaxPrice)
      );
    });

  // if there is a match
  if (matchedItems.length !== 0) {
    for (i = 0; i < matchedItems.length; i++) {
      product.matches.push(matchedItems[i]._id);
      matchedItems[i].matches.push(product._id);
      // create 2-way notifications
      const notificationLiker = new Notification({
        title: "New Match",
        body: `${user.name} has a match with your ${product.title}`,
        creator: user.id,
        notified: product.creator,
        product: product,
      });

      const notificationOther = new Notification({
        title: "New Match",
        body: `${creator.name} has a match with your ${matchedItems[i].title}`,
        creator: product.creator,
        notified: user._id,
        product: matchedItems[i],
      });

      try {
        // create and save
        const sess = await mongoose.startSession();
        sess.startTransaction();

        await notificationLiker.save({ session: sess });
        await notificationOther.save({ session: sess });
        creator.notifications.push(notificationLiker);
        user.notifications.push(notificationOther);
        await matchedItems[i].save({ session: sess });
        await product.save({ session: sess });
        await user.save({ session: sess });
        await creator.save({ session: sess });
        await sess.commitTransaction();
        // dispatch notifications
        let notifications = [];
        const notificationOne = {
          to: creator.pushToken,
          sound: "default",
          title: "New Match",
          body: `${user.name} has a match with your ${product.title}`,
        };

        const notificationTwo = {
          to: user.pushToken,
          sound: "default",
          title: "New Match",
          body: `${creator.name} has a match with your ${matchedItems[i].title}`,
        };

        notifications.push(notificationOne);
        notifications.push(notificationTwo);
        let chunks = expo.chunkPushNotifications(notifications);
        let tickets = [];
        for (let chunk of chunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            // console.log(ticketChunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error(error);
          }
        }
      } catch (err) {
        console.log(err);
        return next(error);
      }
    }
  } else {
    try {
      await product.save();
      await user.save();
    } catch (err) {
      console.log(err);
      return next(error);
    }
  }

  res.status(200).json({ message: "Liked Product", user });
};

// unlike product
const unlikeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
    const matchedProducts = await Product.findById(productId).populate(
      "matches",
      {
        creator: 1,
      }
    );
    let unmatchedProducts;
    unmatchedProducts = matchedProducts.matches.filter(
      (item) => item.creator.toString() === userId.toString()
    );
    for (i = 0; i < unmatchedProducts.length; i++) {
      product.matches.pull(unmatchedProducts[i]);
    }
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

  product.likes.pull(userId);

  let user;
  try {
    user = await User.findById(userId);
    user.likes.pull(product._id);
    userProducts = await User.findById(userId).populate("products", {
      matches: 1,
    });
    for (i = 0; i < userProducts.products.length; i++) {
      userProducts.products[i].matches.pull(productId);
      try {
        await userProducts.products[i].save();
      } catch (err) {
        const error = new HttpError(
          "Could not unlike item, please try again later",
          500
        );
        return next(error);
      }
    }
  } catch (err) {
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
    const error = new HttpError(
      "Could not unlike item, please try again later",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "unLiked Product" });
};

const getLikedProducts = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithLikes;
  try {
    userWithLikes = await User.findById(userId).populate("likes");
  } catch (err) {
    const error = new HttpError(
      "Fetching liked products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithLikes || userWithLikes.likes.length === 0) {
    const error = new HttpError("Could not find likes for user id", 404);
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
exports.getAllProducts = getAllProducts;
exports.getMatchedProducts = getMatchedProducts;
exports.searchForProducts = searchForProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.likeProduct = likeProduct;
exports.unlikeProduct = unlikeProduct;
exports.getLikedProducts = getLikedProducts;
