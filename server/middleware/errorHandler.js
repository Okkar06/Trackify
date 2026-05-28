const errorHandler = (err, _req, res, _next) => {
  const statusCode = Number(err.statusCode) || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
};

module.exports = { errorHandler };

