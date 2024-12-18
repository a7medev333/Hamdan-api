const logger = (req, res, next) => {
    console.log(`
Request Details:
  - Method: ${req.method}
  - Path: ${req.path}
  - Content-Type: ${req.headers['content-type']}
  - Body: ${JSON.stringify(req.body, null, 2)}
  - Query: ${JSON.stringify(req.query, null, 2)}
  - Params: ${JSON.stringify(req.params, null, 2)}
`);
    next();
};

module.exports = logger;
