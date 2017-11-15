const fs = require('fs')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const Handlebars = require('handlebars')
const hbsPath = path.join(__dirname, '../template/dir.hbs')
const mime = require('./mime')
const compress = require('./compress')
const range = require('./range')
const isFresh = require('./cache')
const source = fs.readFileSync(hbsPath)
const template = Handlebars.compile(source.toString())

module.exports = async function (req, res, filePath, conf) {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      const contentType = mime(filePath)
      res.setHeader('Content-Type', contentType)
      if (isFresh(stats, req, res)) {
        res.statusCode = 304
        res.end()
        return
      }
      let rs
      const {code, start, end} = range(stats.size, req, res)
      if (code === 200) {
        res.statusCode = 200
        rs =fs.createReadStream(filePath)
      } else {
        res.statusCode = 206
        rs =fs.createReadStream(filePath, {start, end})
      }
      if (filePath.match(conf.compress)) {
        rs = compress(rs, req, res)
      }
      rs.pipe(res)
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html')
      // TODO:
      const dir = path.relative(conf.root, filePath)
      console.log('dir', conf.root, filePath, dir, files)
      const data = {
        title: path.basename(filePath),
        dir:dir ? `/${dir}` : '',
        files
      }
      res.end(template(data))
    }
  } catch (ex) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${filePath} is not a directory or file \n ${ex}`)
  }
}