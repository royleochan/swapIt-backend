const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Product = require("../models/product");
const User = require("../models/user");
const productPipeline = require("../controllers/pipelines/products-search");

const getProductById = async (req, res, next) => {
  const { pid } = req.params;

  try {
    const product = await Product.findById(pid).populate("creator");
    res.json({ product: product.toObject({ getters: true }) });
  } catch (err) {
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
      .reverse();
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!followingProducts) {
    const error = new HttpError("Could not find any products", 404);
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
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!productsByCategory || productsByCategory.length === 0) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: productsByCategory,
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

const updateProduct = async (req, res, next) => {
  const { title, description, imageUrl, category } = req.body;
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
  product.imageUrl = imageUrl;
  product.category = category;

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

const likeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  // find product and product creator
  let product;
  try {
    product = await Product.findById(productId).populate("creator");
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
        (item.price >= prodMinPrice && item.price <= prodMaxPrice) ||
        prodMinPrice === itemMaxPrice ||
        prodMaxPrice === itemMinPrice ||
        itemMinPrice === prodMinPrice ||
        itemMaxPrice === prodMaxPrice
      );
    });

  // if there is a match
  if (matchedItems.length !== 0) {
    for (i = 0; i < matchedItems.length; i++) {
      product.matches.push(matchedItems[i]._id);
      matchedItems[i].matches.push(product._id);
      try {
        // create and save
        const sess = await mongoose.startSession();
        sess.startTransaction();

        await matchedItems[i].save({ session: sess });
        await product.save({ session: sess });
        await user.save({ session: sess });
        await creator.save({ session: sess });
        await sess.commitTransaction();
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

  res.status(200).json({
    message: "Liked Product",
    user: user.toObject({ getters: true }),
    product: product.toObject({ getters: true }),
  });
};

const unlikeProduct = async (req, res, next) => {
  const { userId } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId).populate("creator");
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

  res.status(200).json({
    message: "Unliked Product",
    user: user.toObject({ getters: true }),
    product: product.toObject({ getters: true }),
  });
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
exports.getMatchedProducts = getMatchedProducts;
exports.searchForProducts = searchForProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.likeProduct = likeProduct;
exports.unlikeProduct = unlikeProduct;
exports.getLikedProducts = getLikedProducts;
