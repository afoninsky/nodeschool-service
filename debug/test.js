const watcher = require('../src/watcher')()
watcher.on('current', console.log)
watcher.on('complete', console.log)
