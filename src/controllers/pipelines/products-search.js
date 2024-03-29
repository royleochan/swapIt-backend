module.exports = productPipeline = [
  {
    $search: {
      text: {
        path: ["title"],
        query: "shirt",
        fuzzy: {
          maxEdits: 1,
          maxExpansions: 100,
        },
      },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "creator",
      foreignField: "_id",
      as: "creator",
    },
  },
  {
    $match: {
      isSwapped: false,
    },
  },
  {
    $unwind: {
      path: "$creator",
      preserveNullAndEmptyArrays: true,
    },
  },
];
