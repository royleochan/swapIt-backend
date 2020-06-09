module.exports = [
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
];

exports.userPipeline = userPipeline;
