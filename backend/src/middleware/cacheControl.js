function cacheControl(maxAgeSeconds = 60) {
  return (req, res, next) => {
    if (req.method === "GET") {
      res.set(
        "Cache-Control",
        `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`
      );
    }
    next();
  };
}

module.exports = cacheControl;
