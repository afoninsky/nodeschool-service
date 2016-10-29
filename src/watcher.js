/**
 * emit workshop events:
 * .on('task', workshop, task) // current selected task in workshop
 * .on('completed', workshop, tasks) // tasks completed in worksop
 *
 * supported workshop frameworks are: workshopper-adventure, adventure
 */
const { watch, readFile } = require('fs')
const { resolve } = require('path')
const EventEmitter = require('events')
const Promise = require('bluebird')

const readFileAsync = Promise.promisify(readFile)
const noop = () => {}

// workshopper-adventure (learnyounode), adventure (stream-adventure)
module.exports = (cfg = {}) => {
  const workshopsDirectory = cfg.workshopsDirectory || resolve(process.env.HOME || process.env.USERPROFILE, '.config')
  const eventEmitter = new EventEmitter()
  watch(workshopsDirectory, { recursive: true }, (eventType, path) => {
    const [ workshop, file ] = path.split('/')
    switch (file) {
      case 'current.json':
        return readFileAsync(`${workshopsDirectory}/${path}`).then(data => {
          const name = JSON.parse(data)
          if (!name) { return } // workshop reseted
          eventEmitter.emit('task', workshop, name)
        }).catch(noop)
      case 'completed.json':
        return readFileAsync(`${workshopsDirectory}/${path}`).then(data => {
          const items = JSON.parse(data)
          if (!items || !items.length) { return } // workshop reseted
          eventEmitter.emit('completed', workshop, items)
        }).catch(noop)
    }
  })
  return eventEmitter
}
