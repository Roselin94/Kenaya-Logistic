function errorHandler(err, req, res, next) {
  console.error('[API ERROR]', err);

  const status = err.status || 500;
  const message = err.message || 'Une erreur interne est survenue sur le serveur.';

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;

