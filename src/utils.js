const { resolve } = require('path')
const { name } = require('../package')
const { watch, readFile, writeFile } = require('fs')
const Promise = require('bluebird')

const readFileAsync = Promise.promisify(readFile)
const writeFileAsync = Promise.promisify(writeFile)

module.exports = {
  configGetSet: async (name, put) => {
    const configPath = resolve(process.env.HOME || process.env.USERPROFILE, `${name}.json`)
    let data = {}
    try {
      data = JSON.parse(await readFileAsync(configPath))
    } catch (err) {
      if (err.code !== 'ENOENT') { throw err }
    }
    if (put) {
      Object.assign(data, put)
      await writeFileAsync(configPath, JSON.stringify(data, null, ' '))
    }
    return data
  }
}
