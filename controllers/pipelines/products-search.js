module.exports = productPipeline = [
  {
    $search: {
      text: {
        path: ["description", "title"],
        query: "shirt",
        fuzzy: {
          maxEdits: 1,
          maxExpansions: 100,
        },
      },
    },
  },
  {
    $project: {
      score: {
        $meta: "searchScore",
      },
    },
  },
  {
    $sort: {
      score: -1,
    },
  },
];

