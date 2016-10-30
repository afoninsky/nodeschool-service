const { resolve } = require('path')
const { name } = require('../package')
const { watch, readFile, writeFile } = require('fs')
const chalk = require('chalk')
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
    } else if (put !== 'undefined') {
      await writeFileAsync(configPath, JSON.stringify({}))
    }
    return data
  },

  dateFormat: _date => {
    const date = _date || new Date()
    return date.toLocaleTimeString()
  },

  displayError: (err, noExit) => {
    const message = err instanceof Error ? err.message : err
    console.error(chalk.bold.red(message))
    if (!noExit) {
      process.exit(1)
    }
  }
}
