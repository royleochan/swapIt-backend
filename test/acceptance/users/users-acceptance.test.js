// Import test dependencies //
const request = require("supertest");
const { expect } = require("chai");

// Import app //
const { app } = require("../../../app.js");

// Import test helpers //
const { newUser } = require("./users-acceptance-helper.js");

// Import models //
const User = require("../../../src/models/user");
const Notification = require("../../../src/models/notification");

// Tests //
describe("User Acceptance Tests", () => {
  // Constants for all test suites //
  const TEST_USER = newUser();

  //##############################################//
  //     1. POST: /users/signup test suite        //
  //##############################################//

  // test suite
  describe("POST: /users/signup", () => {
    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should register new user with valid credentials", async () => {
      const res = await request(app).post("/api/users/signup").send(TEST_USER);

      expect(res.status).to.be.eql(201);
      expect(res.body.user.username).to.be.eql(TEST_USER.username);
    });

    it("shouldn't accept email that already exists in the database", async () => {
      const res = await request(app).post("/api/users/signup").send(TEST_USER);

      expect(res.status).to.be.eql(422);
      expect(res.body.message).to.be.eql(
        "Email already has an account, try logging in."
      );
    });

    it("shouldn't accept username that already exists in the database", async () => {
      const res = await request(app)
        .post("/api/users/signup")
        .send(newUser({ email: "test@gmail.com" }));

      expect(res.status).to.be.eql(422);
      expect(res.body.message).to.be.eql(
        "Username already exists, try logging in or signup using a different username."
      );
    });
  });

  //##############################################//
  //     2. POST: /users/login test suite         //
  //##############################################//

  // test suite
  describe("POST: /users/login", () => {
    // before test suite, create user
    before(async () => {
      try {
        await request(app).post("/api/users/signup").send(TEST_USER);
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should login user when valid credentials are provided", async () => {
      const res = await request(app).post("/api/users/login").send({
        username: TEST_USER.username,
        password: TEST_USER.password,
      });

      expect(res.status).to.be.eql(200);
      expect(res.body.user.username).to.be.eql(TEST_USER.username);
    });

    it("should throw error when username does not exist", async () => {
      const res = await request(app).post("/api/users/login").send({
        username: "blahblah",
        password: TEST_USER.password,
      });

      expect(res.status).to.be.eql(401);
      expect(res.body.message).to.be.eql("USERNAME_NOT_FOUND");
    });

    it("should throw error when password is wrong", async () => {
      const res = await request(app).post("/api/users/login").send({
        username: TEST_USER.username,
        password: "wrong password",
      });

      expect(res.status).to.be.eql(401);
      expect(res.body.message).to.be.eql("INVALID_PASSWORD");
    });
  });

  //##############################################//
  //     3. POST: /users/logout test suite        //
  //##############################################//

  // test suite
  describe("POST: /users/logout", () => {
    // before test suite, create user
    before(async () => {
      try {
        await request(app).post("/api/users/signup").send(TEST_USER);
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should logout user successfully", async () => {
      let userId;

      const responseLoginUser = await request(app)
        .post("/api/users/login")
        .send({
          username: TEST_USER.username,
          password: TEST_USER.password,
        });
      userId = responseLoginUser.body.user._id;

      const responseLogoutUser = await request(app)
        .post("/api/users/logout")
        .send({
          userId: userId,
        });

      expect(responseLogoutUser.status).to.be.eql(200);
      expect(responseLogoutUser.body.Message).to.be.eql(
        "Logged out successfully"
      );
    });
  });

  //##############################################//
  //     4. PATCH: /users/{uid} test suite        //
  //##############################################//

  // test suite
  describe("PATCH: /users/{uid}", () => {
    let testUserId;
    let testUserToken;
    let updateUserBody = {
      name: "Waka",
      username: "wakakaka",
      profilePic: "https://i.imgur.com/tiRSkS8.jpg",
      description: "I hate swapping",
      location: "Bedok",
    };

    // before test suite, create user
    before(async () => {
      try {
        const res = await request(app)
          .post("/api/users/signup")
          .send(TEST_USER);

        testUserId = res.body.user._id;
        testUserToken = res.body.token;
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should update user successfully", async () => {
      const responseUpdateUser = await request(app)
        .patch(`/api/users/${testUserId}`)
        .auth(testUserToken, { type: "bearer" })
        .send(updateUserBody);
      userId = responseUpdateUser.body.user._id;

      expect(responseUpdateUser.status).to.be.eql(200);
      expect(responseUpdateUser.body.user.name).to.be.eql(updateUserBody.name);
      expect(responseUpdateUser.body.user.username).to.be.eql(
        updateUserBody.username
      );
      expect(responseUpdateUser.body.user.profilePic).to.be.eql(
        updateUserBody.profilePic
      );
      expect(responseUpdateUser.body.user.description).to.be.eql(
        updateUserBody.description
      );
      expect(responseUpdateUser.body.user.location).to.be.eql(
        updateUserBody.location
      );
    });
  });

  //#######################################################//
  //     5. PATCH: /users/password/{uid} test suite        //
  //#######################################################//

  // test suite
  describe("PATCH: /users/password/{uid}", () => {
    let testUserId;
    let testUserToken;
    let testUserOldPassword;

    // before test suite, create user
    before(async () => {
      try {
        const res = await request(app)
          .post("/api/users/signup")
          .send(TEST_USER);

        testUserId = res.body.user._id;
        testUserToken = res.body.token;
        testUserOldPassword = TEST_USER.password;
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should update password successfully", async () => {
      const newPassword = "NEWPASSWORD";
      try {
        await request(app)
          .patch(`/api/users/password/${testUserId}`)
          .auth(testUserToken, { type: "bearer" })
          .send({
            currentPassword: testUserOldPassword,
            newPassword: newPassword,
            newPasswordConfirmation: newPassword,
          });
      } catch (err) {
        console.log(err);
      }

      const res = await request(app).post("/api/users/login").send({
        username: TEST_USER.username,
        password: newPassword,
      });

      expect(res.status).to.be.eql(200);
      expect(res.body.user.username).to.be.eql(TEST_USER.username);
    });

    it("should throw error when current password is wrong", async () => {
      const newPassword = "NEWPASSWORD";
      try {
        const res = await request(app)
          .patch(`/api/users/password/${testUserId}`)
          .auth(testUserToken, { type: "bearer" })
          .send({
            currentPassword: "wrong password",
            newPassword: newPassword,
            newPasswordConfirmation: newPassword,
          });

        expect(res.status).to.eql(422);
        expect(res.body.message).to.eql(
          "Current password is wrong, please try again."
        );
      } catch (err) {
        console.log(err);
      }
    });
  });

  //#######################################################//
  //     6. PATCH: /users/pushtoken/{uid} test suite       //
  //#######################################################//

  // test suite
  describe("PATCH: /users/pushToken/{uid}", () => {
    let testUserId;
    let testUserToken;

    // before test suite, create user
    before(async () => {
      try {
        const res = await request(app)
          .post("/api/users/signup")
          .send(TEST_USER);

        testUserId = res.body.user._id;
        testUserToken = res.body.token;
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should update push token successfully", async () => {
      const newPushToken = "expoPushToken";
      const res = await request(app)
        .patch(`/api/users/pushToken/${testUserId}`)
        .auth(testUserToken, { type: "bearer" })
        .send({
          pushToken: newPushToken,
        });

      expect(res.status).to.be.eql(200);
      expect(res.body.user.pushToken).to.be.eql(newPushToken);
    });
  });

  //#############################################################################################################//
  //      7. PATCH: /users/(follow/unfollow)/{uid} and GET: /users/(following/followers)/{uid}  test suite       //
  //#############################################################################################################//

  // test suite
  describe("PATCH: /users/(follow/unfollow)/{uid} and GET: /users/(following/followers)/{uid}", () => {
    let userOneId;
    let userOneToken;
    let userTwoId;
    let userOne = TEST_USER;
    let userTwo = newUser({ username: "bobby", email: "bobby@gmail.com" });

    // before test suite, create 2 users
    before(async () => {
      try {
        const resOne = await request(app)
          .post("/api/users/signup")
          .send(userOne);

        userOneId = resOne.body.user._id;
        userOneToken = resOne.body.token;

        const resTwo = await request(app)
          .post("/api/users/signup")
          .send(userTwo);

        userTwoId = resTwo.body.user._id;
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
        await Notification.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should follow user successfully", async () => {
      try {
        const res = await request(app)
          .patch(`/api/users/follow/${userTwoId}`)
          .auth(userOneToken, { type: "bearer" })
          .send({
            loggedInUserId: userOneId,
          });

        const { followed } = res.body;

        expect(followed.followers).to.contain(userOneId);
        expect(res.status).to.be.eql(200);

        const getLoggedInUser = await request(app).get(
          `/api/users/${userOneId}`
        );
        expect(getLoggedInUser.body.user.following).to.contain(userTwoId);

        notification = Notification.findOne({
          creator: userOneId,
          targetUser: userTwoId,
          type: "FOLLOW",
        });

        expect(notification).to.not.be.empty;
      } catch (err) {
        console.log(err);
      }
    });

    it("should throw error if userOne already follows userTwo", async () => {
      try {
        const res = await request(app)
          .patch(`/api/users/follow/${userTwoId}`)
          .auth(userOneToken, { type: "bearer" })
          .send({
            loggedInUserId: userOneId,
          });

        expect(res.status).to.be.eql(400);
        expect(res.body.message).to.be.eql("Already followed user");
      } catch (err) {
        console.log(err);
      }
    });

    it("gets following users successfully", async () => {
      const getLoggedInUser = await request(app).get(
        `/api/users/following/${userOneId}`
      );

      expect(getLoggedInUser.body.result.following[0]).to.eql({
        _id: userTwoId,
        id: userTwoId,
        username: userTwo.username,
        name: userTwo.name,
        profilePic: userTwo.profilePic,
      });
    });

    it("gets followed users successfully", async () => {
      const getUserTwo = await request(app).get(
        `/api/users/followers/${userTwoId}`
      );

      expect(getUserTwo.body.result.followers[0]).to.eql({
        _id: userOneId,
        id: userOneId,
        username: userOne.username,
        name: userOne.name,
        profilePic: userOne.profilePic,
      });
    });

    it("should unfollow user successfully", async () => {
      try {
        const res = await request(app)
          .patch(`/api/users/unfollow/${userTwoId}`)
          .auth(userOneToken, { type: "bearer" })
          .send({
            loggedInUserId: userOneId,
          });

        const { unfollowed } = res.body;

        expect(unfollowed.followers).to.be.empty;
        expect(res.status).to.be.eql(200);

        const getLoggedInUser = await request(app).get(
          `/api/users/${userOneId}`
        );
        expect(getLoggedInUser.body.user.following).to.be.empty;
      } catch (err) {
        console.log(err);
      }
    });
  });

  //##########################################################//
  //     8. GET: /users/search/{uid}/?query= test suite       //
  //##########################################################//

  // test suite
  // describe.only("GET: /users/search/{uid}/?query=", () => {
  //   let userOneId;
  //   let userTwoId;
  //   let query = "bobb";
  //   let userOne = newUser({
  //     username: "bobb",
  //     email: "bob@gmail.com",
  //   });
  //   let userTwo = newUser({
  //     username: "leoroyy",
  //     email: "bobby@gmail.com",
  //   });

  // before test suite, create 2 users
  //   before(async () => {
  //     try {
  //       const resOne = await request(app)
  //         .post("/api/users/signup")
  //         .send(userOne);

  //       const resTwo = await request(app)
  //         .post("/api/users/signup")
  //         .send(userTwo);

  //       userOneId = resOne.body.user._id;
  //       userTwoId = resTwo.body.user._id;
  //     } catch (err) {
  //       console.log(err);
  //       console.error(err);
  //     }
  //   });

  // after test suite, delete all users
  //   after(async () => {
  //     try {
  //       await User.deleteMany({});
  //     } catch (err) {
  //       console.log(err);
  //       console.error(err);
  //     }
  //   });

  //   it("should search for users successfully", async () => {
  //     const res = await request(app).get(`/api/users/search/a/?query=${query}`);
  //     console.log(res.body);

  //     expect(res.status).to.be.eql(200);
  //   });
  // });

  //#############################################//
  //     9. GET: /users/{uid} test suite         //
  //#############################################//
  describe("GET: /users/{uid}", () => {
    let userOneId;

    // before test suite, create user
    before(async () => {
      try {
        const resOne = await request(app)
          .post("/api/users/signup")
          .send(TEST_USER);

        userOneId = resOne.body.user._id;
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    // after test suite, delete all users
    after(async () => {
      try {
        await User.deleteMany({});
      } catch (err) {
        console.log(err);
        console.error(err);
      }
    });

    it("should get user information successfully", async () => {
      const res = await request(app).get(`/api/users/${userOneId}`);

      expect(res.status).to.be.eql(200);
      expect(res.body.user.products).to.eql([]); //TODO: test with real products
      expect(res.body.user.reviewRating).to.eql(0); //TODO: test with real reviews
    });
  });
});
