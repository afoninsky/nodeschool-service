const seneca = require('seneca-extended')

seneca().use('mesh', {
  isbase: true,
  pin: 'format:hex'
})
.ready(function () {
  console.log('base', this.id)
})
