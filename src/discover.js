const Discover = require('node-discover')

/**
 * { isMaster: false,
  isMasterEligible: true,
  weight: -0.1477810870289,
  address: '192.168.1.36',
  advertisement: { some: 'initial' },
  lastSeen: 1477810891366,
  hostName: 'Mac-mini-drago.local',
  port: 45836,
  id: '9d738481-1c56-4328-ac1b-162ef01257ec' }
 */

module.exports = cfg => {
  const config = Object.assign({}, cfg, {
    port: 45836,
    key: 'strong encription key'
  })
  // discover.on('promotion', () => emitter.emit('is-master'))
  // discover.on('demotion', () => emitter.emit('is-slave'))
  // discover.on('demotion', () => emitter.emit('self.slave'))
  //
  // d.on('added', obj => {
  //   console.log('new member joined')
  //   console.log(obj)
  // })
  //
  // d.on('removed', obj => {
  //   console.log('member leaved')
  //   console.log(obj)
  // })
  //
  // d.on('master', obj => {
  //   console.log('new master process is:')
  //   console.log(obj)
  // })
  return Discover(config)
}
