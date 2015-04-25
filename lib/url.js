module.exports.middleware = function(req, res, next) {
  req.rootUrl = function() {
    var port = req.app.settings.port;
    res.locals.requested_url = req.protocol + '://' + req.hostname  + (port == 80 || port == 443 ? '' : ':' + port);
    return req.protocol + "://" + req.get('host');
  };
  req.fullPath = function() {
    return req.rootUrl() + req.path;
  };
  return next();
};
