const notFound = (_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
};

module.exports = { notFound };

