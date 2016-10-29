#!/usr/bin/env node

const chalk = require('chalk')
const watcher = require('../src/watcher')()
console.log('Start listening workhop events...')
watcher.on('task', (workshop, name) => {
  console.log(chalk.gray(`[${workshop}] task selected: ${name}`))
})
watcher.on('completed', (workshop, tasks) => {
  console.log(chalk.blue(`[${workshop}] tasks completed: ${tasks.join(', ')}`))
})
