module.exports.middleware = function(req, res, next) {
  res.halWithPagination = function (model, req, res, embeds) {
    var size = req.query.size || 10;
    model.findPaginated({}, null, { sort: { _id: 'ascending' }}, function (err, result) {
      if (err) return res.status(500).send(err);
      res.hal({
        data: {
          totalPages: result.totalPages
        },
        embeds: embeds(result.documents, req),
        links: {
          self: req.fullPath() + '?size=' + size + (req.query.anchor ? '&anchor=' + req.query.anchor : ''),
          next: result.nextAnchorId ? req.fullPath() + '?size=' + size + '&anchor=' + result.nextAnchorId : null
        }
      });
    }, size, req.query.anchor);
  };
  return next();
};
