const fs = require('fs')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const Handlebars = require('handlebars')
const hbsPath = path.join(__dirname, '../template/dir.hbs')
const conf = require('../config/defaultConfig')
const source = fs.readFileSync(hbsPath)
const template = Handlebars.compile(source.toString())

module.exports = async function (req, res, filePath) {
  try {
    const stats = await stat(filePath)
    if (stats.isFile()) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      fs.createReadStream(filePath).pipe(res)
    } else if (stats.isDirectory()) {
      const files = readdir(filePath)
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain')
      const data = {
        title: path.basename(filePath),
        dir: path.relative(conf.root, filePath),
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