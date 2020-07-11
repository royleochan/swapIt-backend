const namePipeline = [
  {
    $search: {
      autocomplete: {
        query: "des",
        path: "name",
        tokenOrder: "any",
      },
    },
  },
];

const usernamePipeline = [
  {
    $search: {
      autocomplete: {
        query: "des",
        path: "username",
        tokenOrder: "any",
      },
    },
  },
];

exports.namePipeline = namePipeline
exports.usernamePipeline = usernamePipeline
