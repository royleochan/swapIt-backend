const userPipeline = [
  {
    $search: {
      text: {
        path: ["name", "username"],
        query: "leoroyy",
        fuzzy: {
          maxEdits: 2,
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
];

exports.userPipeline = userPipeline;
