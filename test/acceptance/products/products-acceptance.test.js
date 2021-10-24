// Import test dependencies //
const request = require("supertest");
const { expect } = require("chai");

// Import app //
const { app } = require("../../../app.js");

// Import test helpers //
const { newProduct, newUser } = require("./products-acceptance-helper");

// Import models //
const User = require("../../../src/models/user");
const Product = require("../../../src/models/product");
const Notification = require("../../../src/models/notification");
const Like = require("../../../src/models/like");
const Match = require("../../../src/models/match");
const View = require("../../../src/models/view.js");

// Tests //
describe("Products Acceptance Tests", () => {
  // Constants for all test suites //
  const USER_ONE = newUser();
  const USER_TWO = newUser({ email: "test@gmail.com", username: "tester" });
  const USER_THREE = newUser({ email: "test1@gmail.com", username: "tester1" });
  let USER_ONE_ID;
  let USER_TWO_ID;
  let USER_THREE_ID;
  let USER_ONE_TOKEN;
  let USER_TWO_TOKEN;
  let USER_THREE_TOKEN;

  // before all tests, create three Users
  before(async () => {
    try {
      const resOne = await request(app)
        .post("/api/users/signup")
        .send(USER_ONE);

      const resTwo = await request(app)
        .post("/api/users/signup")
        .send(USER_TWO);

      const resThree = await request(app)
        .post("/api/users/signup")
        .send(USER_THREE);

      USER_ONE_ID = resOne.body.user._id;
      USER_TWO_ID = resTwo.body.user._id;
      USER_THREE_ID = resThree.body.user._id;
      USER_ONE_TOKEN = resOne.body.token;
      USER_TWO_TOKEN = resTwo.body.token;
      USER_THREE_TOKEN = resThree.body.token;
    } catch (err) {
      console.log(err);
      console.error(err);
    }
  });

  // after all tests, delete all users
  after(async () => {
    try {
      await User.deleteMany({});
    } catch (err) {
      console.log(err);
      console.error(err);
    }
  });
  //##############################################//
  //     1. GET: /products/{pid} test suite       //
  //##############################################//
  describe("GET: /products/{pid}", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should get product with correctly populated creator's username", async () => {
      const productToCreate = newProduct({ creator: USER_ONE_ID });

      const createProductRes = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(productToCreate);

      const productId = createProductRes.body.product._id;

      const getProductRes = await request(app).get(
        `/api/products/${productId}/${USER_TWO_ID}`
      );

      expect(getProductRes.status).to.be.eql(200);
      expect(getProductRes.body.product.creator.username).to.be.eql(
        USER_ONE.username
      );
    });

    it("should get product with correctly populated matches", async () => {
      // setting up match
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 40,
        maxPrice: 50,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 30,
        maxPrice: 70,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      const getProductRes = await request(app).get(
        `/api/products/${userOneProductId}/${USER_TWO_ID}`
      );

      expect(getProductRes.status).to.be.eql(200);
      expect(getProductRes.body.product.matches[0].match.isConfirmed).to.be
        .false;
      expect(getProductRes.body.product.matches[0].product.isSwapped).to.be
        .false;
    });
  });

  //############################################################//
  //     2. GET: /products/likedProducts/{uid} test suite       //
  //############################################################//
  describe("GET: /products/likedProducts/{uid}", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should get user's liked products correctly", async () => {
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 5,
        maxPrice: 6,
      });

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      const getLikedProductRes = await request(app).get(
        `/api/products/likedProducts/${USER_ONE_ID}`
      );

      expect(getLikedProductRes.status).to.be.eql(200);
      expect(getLikedProductRes.body.data[0].title).to.be.eql(
        userTwoProduct.title
      );
    });
  });

  //##################################################################//
  //     3. GET: /products/category/{filterCategory} test suite       //
  //##################################################################//
  describe("GET: /products/category/{filterCategory}", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should get products by category correctly", async () => {
      const CATEGORY = "Men's Tops";
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 5,
        maxPrice: 6,
        category: CATEGORY,
      });

      await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const getCategoryProductsRes = await request(app).get(
        `/api/products/category/${CATEGORY}`
      );

      expect(getCategoryProductsRes.status).to.be.eql(200);
      expect(getCategoryProductsRes.body.products[0].title).to.be.eql(
        userTwoProduct.title
      );
    });
  });

  //##############################################//
  //     4. POST: /products test suite            //
  //##############################################//
  describe("POST: /products", () => {
    // after test suite, delete all products
    after(async () => {
      try {
        await Product.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should create new product with valid parameters", async () => {
      const productToCreate = newProduct({ creator: USER_ONE_ID });

      const res = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(productToCreate);

      expect(res.status).to.be.eql(201);
      expect(res.body.product.title).to.be.eql(productToCreate.title);
    });

    it("shouldn't accept new product with empty title", async () => {
      const res = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(newProduct({ title: "" }));

      expect(res.status).to.be.eql(422);
      expect(res.body.message).to.be.eql(
        "Invalid inputs passed, please check your data"
      );
    });
  });

  //##############################################//
  //   5. PATCH: /products/{pid} test suite       //
  //##############################################//
  describe("PATCH: /products/{pid}", () => {
    // after test suite, delete all products
    after(async () => {
      try {
        await Product.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should update product correctly", async () => {
      const productToCreate = newProduct({ creator: USER_ONE_ID });

      const createProductRes = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(productToCreate);

      const productId = createProductRes.body.product._id;

      const patchObj = {
        title: "Nexus Tee",
        description: "New",
        imageUrl: "<valid image url>",
        category: "Men's Tops",
      };

      const updateProductRes = await request(app)
        .patch(`/api/products/${productId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(patchObj);

      expect(updateProductRes.status).to.be.eql(200);
      expect(updateProductRes.body.product.title).to.be.eql(patchObj.title);
    });

    it("should not accept patch request with empty title", async () => {
      const productToCreate = newProduct({ creator: USER_ONE_ID });

      const createProductRes = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(productToCreate);

      const productId = createProductRes.body.product._id;

      const patchObj = {
        title: "",
        description: "New",
        imageUrl: "<valid image url>",
        category: "Men's Tops",
      };

      const updateProductRes = await request(app)
        .patch(`/api/products/${productId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(patchObj);

      expect(updateProductRes.status).to.be.eql(422);
      expect(updateProductRes.body.message).to.be.eql(
        "Invalid inputs passed, please check your data"
      );
    });
  });

  //###################################################//
  //   6. PATCH: /products/like/{pid} test suite       //
  //###################################################//
  describe("PATCH: /products/like/{pid}", () => {
    // after test suite, delete all products, likes, matches, and notifications
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should like product correctly (case with 1 match), throw 400 error if item has already been liked, throw 400 error if item has already been swapped, throw 400 error if trying to unlike item already swapped", async () => {
      // setting up
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 40,
        maxPrice: 50,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 45,
        maxPrice: 55,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      const userOneLikeUserTwoProd = await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      const userTwoLikeUserOneProd = await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      // check that status of request is 200
      expect(userOneLikeUserTwoProd.status).to.be.eql(200);
      expect(userTwoLikeUserOneProd.status).to.be.eql(200);

      // check that 2 like documents were created
      expect(
        await Like.exists({
          productId: userTwoProductId,
          userId: USER_ONE_ID,
        })
      ).to.be.true;
      expect(
        await Like.exists({
          productId: userOneProductId,
          userId: USER_TWO_ID,
        })
      ).to.be.true;

      // check that match is created
      const x = await Match.exists({
        productOneId: userOneProductId,
        productTwoId: userTwoProductId,
      });
      const y = await Match.exists({
        productOneId: userTwoProductId,
        productTwoId: userOneProductId,
      });
      expect(x || y).to.be.true;

      // check that match is added to matches array of both products (check not empty)
      const getProductOneRes = await request(app).get(
        `/api/products/${userOneProductId}/${USER_TWO_ID}`
      );
      const getProductTwoRes = await request(app).get(
        `/api/products/${userTwoProductId}/${USER_ONE_ID}`
      );

      expect(getProductOneRes.body.product.matches).to.be.not.empty;
      expect(getProductTwoRes.body.product.matches).to.be.not.empty;

      // check that like and match notifications are created
      expect(
        await Notification.exists({
          type: "LIKE",
          targetUser: USER_TWO_ID,
          productId: userTwoProductId,
        })
      ).to.be.true;
      expect(
        await Notification.exists({
          type: "LIKE",
          targetUser: USER_ONE_ID,
          productId: userOneProductId,
        })
      ).to.be.true;
      expect(
        await Notification.exists({
          type: "MATCH",
          targetUser: USER_TWO_ID,
          productId: userTwoProductId,
          matchedProductId: userOneProductId,
        })
      ).to.be.true;
      expect(
        await Notification.exists({
          type: "MATCH",
          targetUser: USER_ONE_ID,
          productId: userOneProductId,
          matchedProductId: userTwoProductId,
        })
      ).to.be.true;

      // check that error is thrown if try to like again
      const userOneLikeUserTwoProdAgain = await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      expect(userOneLikeUserTwoProdAgain.status).to.be.eql(400);
      expect(userOneLikeUserTwoProdAgain.body.message).to.be.eql(
        "Already liked item."
      );

      // check that error is thrown if item is already swapped
      const match = await Match.findOne().or([
        { productOneId: userOneProductId },
        { productTwoId: userOneProductId },
      ]);
      await request(app) // userOne send match req
        .patch(`/api/matches/request/send/${match._id}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ pid: userTwoProductId });
      await request(app) // userTwo accept match req (now, marked as swapped)
        .patch(`/api/matches/request/accept/${match._id}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ pid: userOneProductId });

      const userThreeLikesSwappedProduct = await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_THREE_TOKEN, { type: "bearer" })
        .send({ userId: USER_THREE_ID });

      const userThreeUnlikesSwappedProduct = await request(app)
        .patch(`/api/products/unlike/${userOneProductId}`)
        .auth(USER_THREE_TOKEN, { type: "bearer" })
        .send({ userId: USER_THREE_ID });

      expect(userThreeLikesSwappedProduct.status).to.be.eql(400);
      expect(userThreeLikesSwappedProduct.body.message).to.be.eql(
        "Cannot like item that has already been swapped."
      );

      expect(userThreeUnlikesSwappedProduct.status).to.be.eql(400);
      expect(userThreeUnlikesSwappedProduct.body.message).to.be.eql(
        "Cannot unlike item that has already been swapped."
      );
    });

    it("should not match if products are not in same price range", async () => {
      // setting up
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 40,
        maxPrice: 50,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 60,
        maxPrice: 70,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      // check that match is not created
      const x = await Match.exists({
        productOneId: userOneProductId,
        productTwoId: userTwoProductId,
      });
      const y = await Match.exists({
        productOneId: userTwoProductId,
        productTwoId: userOneProductId,
      });
      expect(x || y).to.be.false;
    });
  });

  //#####################################################//
  //   7. PATCH: /products/unlike/{pid} test suite       //
  //#####################################################//
  describe("PATCH: /products/like/{pid}", () => {
    // after test suite, delete all products, likes, matches, and notifications
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should unlike product when there are no matches yet for the product", async () => {
      // setting up
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 45,
        maxPrice: 55,
      });

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      // check that like document is created
      expect(
        await Like.exists({
          productId: userTwoProductId,
          userId: USER_ONE_ID,
        })
      ).to.be.true;

      // send unlike product
      const unlikeUserTwoProdRes = await request(app)
        .patch(`/api/products/unlike/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      expect(unlikeUserTwoProdRes.status).to.be.eql(200);

      // check that like document is deleted
      expect(
        await Like.exists({
          productId: userTwoProductId,
          userId: USER_ONE_ID,
        })
      ).to.be.false;
    });

    it("should unlike product and remove all matches from matches collection and matchIds from product matches array", async () => {
      // setting up
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 40,
        maxPrice: 50,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 45,
        maxPrice: 55,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      // check that match is created
      let x = await Match.exists({
        productOneId: userOneProductId,
        productTwoId: userTwoProductId,
      });
      let y = await Match.exists({
        productOneId: userTwoProductId,
        productTwoId: userOneProductId,
      });
      expect(x || y).to.be.true;

      // unlike
      const unlikeUserTwoProdRes = await request(app)
        .patch(`/api/products/unlike/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      expect(unlikeUserTwoProdRes.status).to.be.eql(200);

      // check that match is deleted
      x = await Match.exists({
        productOneId: userOneProductId,
        productTwoId: userTwoProductId,
      });
      y = await Match.exists({
        productOneId: userTwoProductId,
        productTwoId: userOneProductId,
      });
      expect(x || y).to.be.false;

      // check that match is removed from matches array of both products (just check that no more matches)
      const getProductOneRes = await request(app).get(
        `/api/products/${userOneProductId}/${USER_TWO_ID}`
      );
      const getProductTwoRes = await request(app).get(
        `/api/products/${userTwoProductId}/${USER_ONE_ID}`
      );

      expect(getProductOneRes.body.product.matches).to.be.empty;
      expect(getProductTwoRes.body.product.matches).to.be.empty;
    });
  });

  //##############################################//
  //     8. DELETE: /products/{pid} test suite    //
  //##############################################//
  describe("DELETE: /products/{pid}", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await View.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should delete product, associated likes, associated matches, and associated notifications if product is not swapped", async () => {
      // setting up match and swap
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 1,
        maxPrice: 5,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 5,
        maxPrice: 6,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      // delete product
      const deleteProductRes = await request(app)
        .delete(`/api/products/${userOneProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" });

      const getProductRes = await request(app).get(
        `/api/products/${userOneProductId}/${USER_TWO_ID}`
      );

      expect(deleteProductRes.status).to.be.eql(200);
      expect(getProductRes.status).to.be.eql(404);
      expect(
        await Like.exists({
          productId: userOneProductId,
        })
      ).to.be.false;
      expect(
        await Match.exists({
          productOneId: userOneProductId,
        })
      ).to.be.false;
      expect(
        await Match.exists({
          productTwoId: userOneProductId,
        })
      ).to.be.false;
      expect(
        await Notification.exists({
          productId: userOneProductId,
        })
      ).to.be.false;
    });

    it("should merely mark product as deleted with isDeleted flag and delete associated likes if product is swapped", async () => {
      // setting up match and swap
      const userOneProduct = newProduct({
        creator: USER_ONE_ID,
        minPrice: 1,
        maxPrice: 5,
      });
      const userTwoProduct = newProduct({
        creator: USER_TWO_ID,
        minPrice: 5,
        maxPrice: 6,
      });

      const createUserOneProduct = await request(app)
        .post("/api/products")
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(userOneProduct);

      const createUserTwoProduct = await request(app)
        .post("/api/products")
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send(userTwoProduct);

      const userOneProductId = createUserOneProduct.body.product._id;
      const userTwoProductId = createUserTwoProduct.body.product._id;

      await request(app)
        .patch(`/api/products/like/${userTwoProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ userId: USER_ONE_ID });

      await request(app)
        .patch(`/api/products/like/${userOneProductId}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ userId: USER_TWO_ID });

      const match = await Match.findOne().or([
        { productOneId: userOneProductId },
        { productTwoId: userOneProductId },
      ]);
      await request(app) // userOne send match req
        .patch(`/api/matches/request/send/${match._id}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send({ pid: userTwoProductId });
      await request(app) // userTwo accept match req (now, marked as swapped)
        .patch(`/api/matches/request/accept/${match._id}`)
        .auth(USER_TWO_TOKEN, { type: "bearer" })
        .send({ pid: userOneProductId });

      // delete product
      const deleteProductRes = await request(app)
        .delete(`/api/products/${userOneProductId}`)
        .auth(USER_ONE_TOKEN, { type: "bearer" });

      const getProductRes = await request(app).get(
        `/api/products/${userOneProductId}/${USER_TWO_ID}`
      );

      expect(deleteProductRes.status).to.be.eql(200);
      expect(getProductRes.status).to.be.eql(200);
      expect(getProductRes.body.product.isSwapped).to.be.true;
      expect(getProductRes.body.product.isDeleted).to.be.true;
      expect(
        await Like.exists({
          productId: userOneProductId,
        })
      ).to.be.false;
    });
  });
});
