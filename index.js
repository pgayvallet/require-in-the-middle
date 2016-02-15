'use strict'

var path = require('path')
var Module = require('module')
var resolve = require('resolve')
var parse = require('module-details-from-path')

var orig = Module._load

module.exports = function hook (modules, onrequire) {
  if (typeof modules === 'function') return hook(null, modules)

  var patched = {}

  Module._load = function (request, parent, isMain) {
    var exports = orig.apply(Module, arguments)

    var filename = Module._resolveFilename(request, parent)
    var core = filename.indexOf(path.sep) === -1
    var name, basedir

    if (core) {
      name = filename
    } else {
      var stat = parse(filename)
      if (!stat) return exports // abort if filename could not be parsed
      name = stat.name
      basedir = stat.basedir

      // figure out if this is the main module file, or a file inside the module
      var res = resolve.sync(name, { basedir: basedir })
      if (res !== filename) return exports // abort if not main module file
    }

    // abort if module name isn't on whitelist
    if (modules && modules.indexOf(name) === -1) return exports

    if (patched[filename]) return exports // abort if module have already been processed
    patched[filename] = true

    return onrequire(exports, name, basedir)
  }
}
