/**
 * Creates a default user object with partial fields from partial User
 *
 * @param {object} partialUser optional param: object with partial fields of a user
 * @returns Object representing a User
 */
const newUser = (partialUser) => {
  data = {
    name: "Roy",
    email: "roy@gmail.com",
    password: "qwerty123",
    username: "leoroyy",
    profilePic: "https://i.imgur.com/tiRSkS8.jpg",
    description: "I love swapping",
    location: "Tampines",
  };

  return { ...data, ...partialUser };
};

exports.newUser = newUser;
