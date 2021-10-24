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

/**
 * Creates a default product object with partial fields from partial Product
 *
 * @param {object} partialUser param: object with partial fields of a user, creator is NOT optional but other fields are optional
 * @returns Object representing a product
 */
const newProduct = (partialProduct) => {
  data = {
    title: "Fred Perry Polo Tee",
    imageUrl: "test",
    description: "Good condition",
    minPrice: 40,
    maxPrice: 60,
    creator: "",
    category: "Men's Tops",
  };

  return { ...data, ...partialProduct };
};

exports.newUser = newUser;
exports.newProduct = newProduct;
