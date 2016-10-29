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
const readFileParsed = async path => {
  let result
  try {
    const data = await readFileAsync(path)
    result = JSON.parse(data)
  } finally {
    return result
  }
}

// workshopper-adventure (learnyounode), adventure (stream-adventure)
module.exports = (cfg = {}) => {
  const workshopsDirectory = cfg.workshopsDirectory || resolve(process.env.HOME || process.env.USERPROFILE, '.config')
  const eventEmitter = new EventEmitter()
  watch(workshopsDirectory, { recursive: true }, async (eventType, path) => {
    const [ workshop, file ] = path.split('/')
    if (file === 'current.json') {
      const name = await readFileParsed(`${workshopsDirectory}/${path}`)
      if (!name) { return } // workshop resetted or file error
      return eventEmitter.emit('task', workshop, name)
    }
    if (file === 'completed.json') {
      const items = await readFileParsed(`${workshopsDirectory}/${path}`)
      if (!items || !items.length) { return } // workshop resetted or file error
      return eventEmitter.emit('completed', workshop, items)
    }
  })
  return eventEmitter
}
