function dir (p) { return require('path').join( __dirname, p) }

var q = require('qunitjs')
require('qunit-tap')(q, console.log.bind(console))

q.init()
q.config.updateRate = 0

q.assert.is = q.assert.strictEqual
q.assert.like = function (str, reg, mes) { this.ok(reg.test(str), mes) }

module.exports = q
