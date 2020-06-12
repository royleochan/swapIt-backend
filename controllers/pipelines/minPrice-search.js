module.exports = minPricePipeline = [
  {
    $search: {
      range: {
        path: "minPrice",
        gte: 0,
        lte: 100,
      },
    },
  },
];
