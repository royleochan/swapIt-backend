// Import test dependencies //
const request = require("supertest");
const { expect } = require("chai");

// Import app //
const { app } = require("../../../app.js");

// Import test helpers //
const { newUser } = require("./users-acceptance-helper.js");

// Import models //
const User = require("../../../src/models/user");

// Tests //
describe("User Acceptance Tests", () => {
  // runs once after last test in block: cleanup by deleting all users after testing
  after(async () => {
    try {
      await User.deleteMany({});
    } catch (err) {
      console.log(err);
      console.error(err);
    }
  });

  describe("POST: /users/signup", () => {
    it("should register new user with valid credentials", (done) => {
      request(app)
        .post("/api/users/signup")
        .send(newUser())
        .expect(201)
        .then((res) => {
          expect(res.body.username).to.be.eql(newUser.username);
          done();
        })
        .catch((err) => done(err));
    });

    it("shouldn't accept email that already exists in the database", (done) => {
      request(app)
        .post("/api/users/signup")
        .send(newUser())
        .expect(422)
        .then((res) => {
          expect(res.body.message).to.be.eql(
            "Email already has an account, try logging in."
          );
          done();
        })
        .catch((err) => done(err));
    });

    it("shouldn't accept username that already exists in the database", (done) => {
      request(app)
        .post("/api/users/signup")
        .send(newUser({ email: "test@gmail.com" }))
        .expect(422)
        .then((res) => {
          expect(res.body.message).to.be.eql(
            "Username already exists, try logging in or signup using a different username."
          );
          done();
        })
        .catch((err) => done(err));
    });
  });
});
