const { cache } = require('../config/defaultConfig')
function refreshRes(stats, res) {
  const {maxAge, expires, cacheControl, lastModified, etag} = cache
  if (expires) {
    res.setHeader('Expires', (new Date(Date.now() + maxAge * 1000)).toUTCString())
  }
  if (cacheControl) {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`)
  }
  if (lastModified) {
    res.setHeader('last-Modified', stats.mtime)
  }
  if (etag) {
    res.setHeader('ETag', `${stats.size}-${stats.mtime}`)
  }
}

module.exports = function isFresh(stats, req, res) {
  refreshRes(stats, res)
  const lastModifie = req.headers['if-modified-since']
  const etag = req.headers['if-none-match']
  if (!lastModifie && !etag) {
    return false
  }
  if (lastModifie && lastModifie !== res.getHeader('Last-Modified')) {
    return false
  }
  if (etag && etag !== res.getHeader('ETag')) {
    return false
  }
  return true
}