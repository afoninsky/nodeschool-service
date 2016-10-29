const seneca = require('seneca-extended')

seneca().use('mesh').ready(function () {
  this.act({role: 'mesh', get: 'members'}, function (err, out) {
    console.log(err, out)
    this.close()
  })
 })
