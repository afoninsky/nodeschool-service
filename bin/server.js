#!/usr/bin/env node --harmony

const program = require('commander')
const { displayError } = require('../src/utils')
const Storage = require('../src/storage')
const Koa = require('koa')
const koaBody = require('koa-body')
const package = require('../package')


program
  .version(package.version)
  .description('launch nodeschool server')
  .option('-a, --auth [string] (requred)', 'token for gist access: https://github.com/settings/tokens')
  .option('-u, --users [string]', 'private gist with authentificated user tokens')
  .option('-w, --workshops [string]', 'private gist id for storage (will create new if none provided)')
  .option('-h, --hello [string]', 'welcome message')
  .option('-p, --port [number]', 'connection port (default: 1212)', 1212)
  .option('-s, --sync [minutes]', 'sync interval with remote servers (default: 10 min)', 10)
  .parse(process.argv)

if (!program.auth) {
  program.help()
}

if (!program.users) {
  console.warn('Will create new gist for users, auth on previous nodeschool meetup events will be lost')
}

// synced storage between local filesystem and github gists
const storage = new Storage({
  path: `${process.env.HOME || process.env.USERPROFILE}/.config/${package.name}`,
  credentials: {
    type: 'token',
    token: program.auth
  },
  items: [{
    name: 'server'
  }, {
    name: 'users',
    gistId: program.users,
    syncInterval: program.sync * 1000
  }, {
    name: 'workshops',
    gistId: program.workshops,
    syncInterval: program.sync * 1000
  }]
})

// data passed durning discovery to every node
const advertisement = {}
advertisement.port = program.port
if (program.welcome) { advertisement.welcome = program.hello }

const weight = 100
const discover = require('../src/discover')({ weight, advertisement })

// create web server
const app = new Koa()
app.use(koaBody())
app.use(require('../src/rest')(app, storage, package))

// find nodes and promote to server status
console.log('Waiting for promotion...')

discover.on('demotion', async () => {
  // 2do: sync data before exit
  displayError('Looks like other master launched, exiting...')
})

discover.on('promotion', async () => {
  console.log('Im master now')
  await storage.init()
  app.listen(program.port)
  console.log(`Server started on port ${advertisement.port}`)
  console.log('Ready!')
})
