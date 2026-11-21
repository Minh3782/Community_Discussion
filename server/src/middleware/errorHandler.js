export const notFound = (req, res, next) => {
  const err = new Error(`Not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(err);
  if (err.retryAfter) res.set('Retry-After', String(err.retryAfter));
  res.status(status).json({
    message: status >= 500 ? 'Something went wrong.' : err.message,
    ...(err.retryAfter && { retryAfter: err.retryAfter }),
    ...(status < 500 && err.fields && { fields: err.fields }),
  });
};
