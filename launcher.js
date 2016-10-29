const { spawn } = require('child_process')
const { resolve } = require('path')
const { existsSync } = require('fs')
const chalk = require('chalk')

const error = chalk.bold.red
const [,, name, ...params] = process.argv
const workshop = spawn(name, params, { stdio: 'inherit' })

const workshopDirectory = resolve(process.env.HOME || process.env.USERPROFILE, '.config', name)
const workshopFirstRun = !existsSync(workshopDirectory)

function getWorkshopStats(dir) {
  if (!existsSync(workshopDirectory)) {
    return false
  }
}

workshop.on('error', err => {
  if (err.code === 'ENOENT') { // 2do: should we install workshop automaticly ?
    console.log(error('Please install workshop first:'))
    console.log(chalk.gray(`# install -g ${name}`))
    console.log('')
    process.exit(1)
  } else {
    console.log(error(err.message))
  }
  process.exit(1)
})

workshop.on('close', exitCode => {
  if (exitCode) { return }
  if (!existsSync(workshopDirectory)) { // 2do: report issue automaticly
    console.log(error('Looks like this workshop is not supported by __name__. Issue created: __link___'))
    process.exit(1)
  }
  console.log('do something with changes')
})
