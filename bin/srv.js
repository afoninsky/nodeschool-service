#!/usr/bin/env node --harmony

const program = require('commander')
const { displayError } = require('../src/utils')
const Gist = require('../src/gist')
const Koa = require('koa')
const koaBody = require('koa-body')
const package = require('../package')


program
  .version(package.version)
  .description('launch nodeschool server')
  .option('-a, --auth [string] (requred)', 'Token with gist access: https://github.com/settings/tokens')
  .option('-u, --users [string]', 'Private gist with authentificated user tokens')
  .option('-w, --workshops [string]', 'Private gist id for storage (will create new if none provided)')
  .option('-w, --welcome [string]', 'Welcome message')
  .option('-p, --port [number]', 'Connection port')
  .parse(process.argv)
if (!program.auth) {
  program.help()
}

if (!program.users) {
  console.warn('Will create new gist for users, auth on previous nodeschool meetup events will be lost')
}

const advertisement = {}
advertisement.port = program.port || 1212
if (program.welcome) { advertisement.welcome = program.welcome }

const weight = 100
const discover = require('../src/discover')({ weight, advertisement })

// create storage
const config = {}
config.credentials = {
  type: 'token',
  token: program.auth
}
if (program.users) { config.userGist = program.users}
if (program.workshops) { config.workshopGist = program.workshops}

const storage = new Gist(config)
// create web server
const app = new Koa()
app.use(koaBody())
app.use(require('../src/rest')(app, storage, package))
console.log('Waiting for promotion...')

discover.on('demotion', () => displayError('Looks like other master launched, exiting...'))
discover.on('promotion', async () => {
  console.log('Im master now')
  try {
    await storage.init()
  } catch (err) {
    if (err.message.includes('Bad credentials')) {
      err.message = `Invalid GitHub access token. Please create new one with gist create permissions: https://github.com/settings/tokens`
    }
    displayError(err)
  }
  app.listen(advertisement.port)
  console.log(`Server started on port ${advertisement.port}`)
  console.log('Ready!')
})
