#!/usr/bin/env node --harmony

const GitHubApi = require('github')
const chalk = require('chalk')
const readlineSync = require('readline-sync')
const EventEmitter = require('events')
const assert = require('assert')
const { configGetSet, dateFormat, displayError } = require('../src/utils')
const package = require('../package')

const [,, action, ...params] = process.argv

const emitter = new EventEmitter()
const github = new GitHubApi()
const noop = () => {}

const settingsGetSet = async (current, set) => {
  Object.assign(current, {
    login: process.env.USER || 'workshoper'
  }, await configGetSet('settings', set))
}

const master = {
  address: null
}

let request = require('request-promise')
;(async () => {

  // const config = {}
  //
  // if (action === 'logout') {
  //   await settingsGetSet(config, false)
  //   console.log(chalk.gray('Logged out'))
  //   process.exit()
  // }

  // await settingsGetSet(config)
  // let isUserLogged


  const emitter = new EventEmitter()
  advertisement = {
    platform: process.platform,
    version: process.version
  }
  const discover = require('../src/discover')({ advertisement })

  // join network and search for master
  console.log('Connecting to server...')
  const timeoutTimer = setTimeout(displayError, 5000, 'No servers found, please try later.')
  discover.on('promotion', () => discover.demote(true))
  discover.on('master', async obj => {
    clearTimeout(timeoutTimer)
    const { id, address, advertisement } = obj
    if (advertisement.welcome) {
      console.log(advertisement.welcome)
    }
    request = request.defaults({
      baseUrl: `http://${advertisement.address || address}:${advertisement.port || 8080}`,
      json: true
    })
    // check if master have api and version exact
    const serverInfo = await request('/')
    try {
      assert.equal(serverInfo.version, package.version, `versions mismatch: server@${serverInfo.verison}, client@${package.version}`)
    } catch (err) {
      displayError(err)
    }


    // register in application
    const credentials = { type: 'basic' }
    // credentials.username = readlineSync.question('GitHub username:')
    // credentials.password = readlineSync.question('GitHub password:', { hideEchoBack: true })
    credentials.username = 'afoninsky'
    credentials.password = 'mpdjx18w'
    github.authenticate(credentials)
    let hashed_token
    try {
      const result = await github.authorization.getOrCreateAuthorizationForApp(serverInfo.auth)
      if (result.token) { // auth on server
        console.log(11)
        const response = await request({ method: 'POST', url: '/auth',
          body: { token: result.token, hashed_token: result.hashed_token }})
      }
      hashed_token = result.hashed_token
    } catch (err) {
      if (err.message.includes('Bad credentials')) {
        err.message = `Invalid GitHub username or password.`
      }
      displayError(err)
    }


    request = request.defaults({ headers: { Authorization: hashed_token }})
    // 2do: check auth
    // const res = await request('/')
    // console.log(res)
  })

  // while (!isUserLogged) {
  //
  //   // auth application to access profile
  //   console.log(1, config)
  //   if (!config.token) {
  //     const credentials = { type: 'basic' }
  //     const note = `requested by ${package.name}`
  //     const username = credentials.username = readlineSync.question('GitHub username:')
  //     credentials.password = readlineSync.question('GitHub password:', { hideEchoBack: true })
  //     github.authenticate(credentials)
  //     try {
  //       const { token } = await github.authorization.create({ note })
  //       await settingsGetSet(config, { token })
  //     } catch (err) {
  //       let message
  //       if (err.message.includes('already_exists')) {
  //         message = `Token already exists. Please go to https://github.com/settings/tokens, delete token with name "${note}" and try again.`
  //       }
  //       if (err.message.includes('Bad credentials')) {
  //         message = `Invalid username or password.`
  //       }
  //       displayError(message || err.message)
  //     }
  //   }
  //
  //   // request profile info
  //   github.authenticate({
  //     type: 'token',
  //     token: config.token,
  //   })
  //   try {
  //     const user = await github.users.get({})
  //     await settingsGetSet(config, {
  //       id: user.id,
  //       login: user.login,
  //       name: user.name,
  //       avatar_url: user.avatar_url,
  //       url: user.html_url
  //     })
  //     isUserLogged = true
  //   } catch (err) {
  //     console.log(2, err)
  //     await settingsGetSet(config, { token: null })
  //     displayError(err.message, true)
  //   }
  // }
  //
  //
  // console.log(chalk.gray(`Logged as ${config.login}`))
  // console.log(chalk.gray('Start listening workhop events...'))
  //
  // // watch workshop events
  // const emitter = new EventEmitter()
  // require('../src/watcher')({ emitter })
  // const { discover } = require('../src/discover')({ emitter })
  // discover.advertise({
  //   id: config.id,
  //   login: config.login,
  //   name: config.name,
  //   avatar_url: config.avatar_url,
  //   url: config.url
  // })
  // emitter.on('task', (workshop, name) => {
  //   const message = chalk.yellow(`${dateFormat()} [${workshop}] task ${name} selected`)
  //   console.log(message)
  // })
  // emitter.on('completed', (workshop, tasks) => {
  //   const message = chalk.blue(`${dateFormat()} [${workshop}]: current progress is ${tasks.split(',')}`)
  //   console.log(message)
  // })
  // discover.join('workshoppers', data => {
  //   // const { event, worksop, message, username } = data
  //   // let log
  //   // switch (event) {
  //   //   case 'task':
  //   //     log = chalk.gray(`${new Date()} [${username}] ${workshop}: task ${message} selected`)
  //   //     break
  //   //   case 'completed':
  //   //     const log = chalk.yellow(`${new Date()} [${username}] ${workshop}: current progress is ${message.split(',')}`)
  //   //     break
  //   //   default:
  //   //     return
  //   // }
  //   // console.log(log)
  // })
})()

/*
  nodeschool
  nodeschool logout
 */
