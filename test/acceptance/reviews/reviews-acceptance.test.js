// Import test dependencies //
const request = require("supertest");
const { expect } = require("chai");

// Import app //
const { app } = require("../../../app.js");

// Import test helpers //
const {
  newProduct,
  newUser,
  newReview,
} = require("./reviews-acceptance-helper");

// Import models //
const User = require("../../../src/models/user");
const Product = require("../../../src/models/product");
const Notification = require("../../../src/models/notification");
const Like = require("../../../src/models/like");
const Match = require("../../../src/models/match");
const Review = require("../../../src/models/review");

// Tests //
describe("Reviews Acceptance Tests", () => {
  // Constants for all test suites //
  const USER_ONE = newUser();
  const USER_TWO = newUser({ email: "test@gmail.com", username: "tester" });
  let USER_ONE_ID;
  let USER_TWO_ID;
  let USER_ONE_TOKEN;
  let USER_TWO_TOKEN;

  // before all tests, create two Users
  before(async () => {
    try {
      const resOne = await request(app)
        .post("/api/users/signup")
        .send(USER_ONE);

      const resTwo = await request(app)
        .post("/api/users/signup")
        .send(USER_TWO);

      USER_ONE_ID = resOne.body.user._id;
      USER_TWO_ID = resTwo.body.user._id;
      USER_ONE_TOKEN = resOne.body.token;
      USER_TWO_TOKEN = resTwo.body.token;
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

  //######################$################//
  //     1. POST: /reviews test suite      //
  //######################$################//
  describe.only("POST: /reviews", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        await Product.deleteMany({});
        await Like.deleteMany({});
        await Match.deleteMany({});
        await Notification.deleteMany({});
        await Review.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should create review correctly", async () => {
      // setting up match and swap
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
        `/api/products/${userOneProductId}`
      );

      const matchId = getProductRes.body.product.matches[0].match.id;

      // create review from user one to user two
      const createReviewRes = await request(app)
        .post(`/api/reviews`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(
          newReview({
            creator: USER_ONE_ID,
            reviewed: USER_TWO_ID,
            matchId,
            pid: userTwoProductId,
          })
        );

      expect(createReviewRes.status).to.be.eql(201);

      // throw error if review already made
      const createReviewAgainRes = await request(app)
        .post(`/api/reviews`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(
          newReview({
            creator: USER_ONE_ID,
            reviewed: USER_TWO_ID,
            matchId,
            pid: userTwoProductId,
          })
        );

      expect(createReviewAgainRes.status).to.be.equal(400);
      expect(createReviewAgainRes.body.message).to.be.equal(
        "Review has already been made"
      );

      // check that review is created
      expect(
        await Review.exists({
          creator: USER_ONE_ID,
          reviewed: USER_TWO_ID,
          matchId: matchId,
        })
      ).to.be.true;

      // check that match is marked as reviewed
      const match = await Match.findById(matchId);
      expect(match.productTwoIsReviewed).to.be.true;

      // check that review notification is created
      expect(
        await Notification.exists({
          type: "REVIEW",
          targetUser: USER_TWO_ID,
        })
      ).to.be.true;
    });
  });

  //##########################$$$$$$############//
  //     2. GET: /reviews/{uid} test suite      //
  //################################$$$$$$######//
  describe.only("GET: /reviews/{uid}", () => {
    // after test suite, cleanup
    after(async () => {
      try {
        // await Product.deleteMany({});
        // await Like.deleteMany({});
        // await Match.deleteMany({});
        // await Notification.deleteMany({});
        // await Review.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should get reviews correctly", async () => {
      // setting up match and swap
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
        `/api/products/${userOneProductId}`
      );

      const matchId = getProductRes.body.product.matches[0].match.id;

      // create review from user one to user two
      await request(app)
        .post(`/api/reviews`)
        .auth(USER_ONE_TOKEN, { type: "bearer" })
        .send(
          newReview({
            creator: USER_ONE_ID,
            reviewed: USER_TWO_ID,
            matchId,
            pid: userTwoProductId,
          })
        );

      // test get
      const getReviewForUserRes = await request(app).get(
        `/api/reviews/${USER_TWO_ID}`
      );

      expect(getReviewForUserRes.status).to.be.eql(200);
      expect(getReviewForUserRes.body.reviewRating).to.be.eql(
        newReview().rating
      );
      expect(getReviewForUserRes.body.reviews[0].creator.name).to.be.eql(
        USER_ONE.name
      );
      expect(getReviewForUserRes.body.reviews[0].creator.profilePic).to.be.eql(
        USER_ONE.profilePic
      );

      const getUserRes = await request(app).get(`/api/users/${USER_TWO_ID}`);
      expect(getUserRes.body.user.reviewRating).to.be.eql(newReview().rating);
    });
  });
});
