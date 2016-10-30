#!/usr/bin/env node --harmony

const GitHubApi = require('github')
const chalk = require('chalk')
const readlineSync = require('readline-sync')
const EventEmitter = require('events')
const { configGetSet } = require('../src/utils')
const package = require('../package')

const [,, action, ...params] = process.argv

const github = new GitHubApi()
const emitter = new EventEmitter()
const noop = () => {}

;(async () => {

  const config = Object.assign({}, {
    username: process.env.USER || 'workshoper'
  }, await configGetSet('settings'))

  switch (action) {

    case 'auth':
      const credentials = { type: 'basic' }
      const note = `requested by ${package.name}`
      const username = credentials.username = readlineSync.question('GitHub username:')
      credentials.password = readlineSync.question('GitHub password:', { hideEchoBack: true })
      github.authenticate(credentials)
      try {
        const { token } = await github.authorization.create({ note })
        Object.assign(config, await configGetSet('settings', { username, token }))
      } catch (err) {
        if (err.message.includes('already_exists')) {
          console.log(`Token already exists. Please go to https://github.com/settings/tokens, delete token with name "${note}" and try again.`)
        } else {
          console.error(err.message)
        }
        process.exit(1)
      }
      console.log(`Successfuly logged as ${username}`)
      process.exit()

    case 'mentor':
      console.log('Joining mentors channel...')
      const { discover } = require('../src/discover')({ emitter })
      discover.join('mentors', data => {
        const { event, worksop, message, username } = data
        let log
        switch (event) {
          case 'task':
            log = chalk.gray(`${new Date()} [${username}] ${workshop}: task ${message} selected`)
            break
          case 'completed':
            const log = chalk.yellow(`${new Date()} [${username}] ${workshop}: current progress is ${message.split(',')}`)
            break
          default:
            return
        }
        console.log(log)
      })


    case 'watch':
      console.log('Start watching current progress...')
      const advertisement = {
        username: config.username,
        token: config.token
      }
      require('../src/watcher')({ emitter })
      const { discover } = require('../src/discover')({ emitter, advertisement })
      discover.join('mentors', noop)
      // setTimeout(() => {
        // discover.send('workshopers', { some: 'data'} )
      // }, 1000)
      emitter.on('task', (workshop, name) => {
        const message = chalk.gray(`${new Date()} [${config.username}] ${workshop}: task ${name} selected`)
        console.log(message)
        discover.send('mentors', {
          event: 'task',
          workshop: workshop,
          message: name,
          username: config.username
        })
      })
      emitter.on('completed', (workshop, tasks) => {
        const message = chalk.yellow(`${new Date()} [${config.username}] ${workshop}: current progress is ${tasks.split(',')}`)
        console.log(message)
        discover.send('mentors', {
          event: 'completed',
          workshop: workshop,
          message: tasks,
          username: config.username
        })
      })
  }

  // github.authenticate({
  //   type: 'token',
  //   token: config.token,
  // })
  // const user = await github.users.get({})
  console.log(config)

})()

/*
  nodeschool login - auth via github
  nodeschool watch - start tracking workhops progress
 */
