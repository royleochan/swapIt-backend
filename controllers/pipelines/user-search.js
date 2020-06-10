module.exports = [
  {
    $search: {
      text: {
        path: ["name", "username"],
        query: "leoroyy",
        fuzzy: {
          maxEdits: 1,
          maxExpansions: 100,
        },
      },
    },
  },
];

