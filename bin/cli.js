#!/usr/bin/env node --harmony

const GitHubApi = require('github')
const readlineSync = require('readline-sync')
const package = require('../package')

const [,, action, ...params] = process.argv
const { configGetSet } = require('../src/utils')

const github = new GitHubApi()

;(async () => {

  const config = Object.assign({}, {
    username: process.env.USER || 'workshoper'
  }, await configGetSet('settings'))

  switch (action) {

    case 'login':
      const credentials = { type: 'basic' }
      const note = `${package.name} request`
      const username = credentials.username = readlineSync.question('GitHub username:')
      credentials.password = readlineSync.question('GitHub password:', { hideEchoBack: true })
      github.authenticate(credentials)
      try {
        const { token } = await github.authorization.create({ note })
        Object.assign(config, await configGetSet('settings', { username, token }))
        console.log(`Successfuly logged as ${username}`)
        process.exit()
      } catch (err) {
        if (err.message.includes('already_exists')) {
          console.log(`Token already exists. Please go to https://github.com/settings/tokens, revoke token with name "${note}" and try again.`)
        } else {
          console.error(err.message)
        }
        process.exit(1)
      }

      case 'watch':
        console.log('Start watching current progress...')
        const watcher = require('../src/watcher')()
        watcher.on('task', (workshop, name) => {
          console.log(`${new Date()} [${config.username}] ${workshop}: task ${name} selected`)
        })
        watcher.on('completed', (workshop, tasks) => {
          console.log(`${new Date()} [${config.username}] ${workshop}: current progress is ${tasks.split(',')}`)
        })
  }

  github.authenticate({
    type: 'token',
    token: config.token,
  })
  const user = await github.users.get({})
  console.log(user)

})()

/*
  nodeschool login - auth via github
  nodeschool watch - start tracking workhops progress
 */
