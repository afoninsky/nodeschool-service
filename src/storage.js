const GitHubApi = require('github')
const Promise = require('bluebird')
const { mkdirpAsync } = Promise.promisifyAll(require('mkdirp'))
const { readFileAsync, writeFileAsync } = Promise.promisifyAll(require('fs'))
const { resolve } = require('path')

class StorageItem {
  constructor(path, item, github) {
    if (!item.name) { throw new Error('item.name not specified')}

    this.github = github
    this.filename = `${item.name}.json`
    this.gistId = item.gistId
    this.gistUrl = item.gistUrl

    this.path = resolve(path, this.filename)

    if (item.syncInterval) {
      this.syncTimer = setInterval(this.sync, item.syncInterval)
    }
  }

  async get(withTimestamp = false) {
    try {
      const { updated, data } = JSON.parse(await readFileAsync(this.path))
      return withTimestamp ? { updated, data } : data
    } catch (err) {
      if (err.code !== 'ENOENT') { throw err }
      return {}
    }
  }

  async set(data = {}, append = false, updateTime) {
    const updated = updateTime ? new Date(updateTime) : new Date()
    const content = { updated, data }
    if (!append) {
      await writeFileAsync(this.path, JSON.stringify(content, null, ' '))
      return content.data
    }
    content.data = await this.get()
    Object.assign(content.data, data)
    await writeFileAsync(this.path, JSON.stringify(content, null, ' '))
    return content.data
  }

  async upload() {
    if (!this.github) { throw new Error('unable to create gist: github credentials is not set') }
    const item = this.item
    if (this.gistId) { throw new Error(`${this.filename}: gist id specified, use .sync instead`) }
    const config = { files: {}, public: false}
    config.files[this.filename] = { content: JSON.stringify(await this.get(), null, ' ') }
    const { id, html_url, updated_at } = await this.github.gists.create(config)
    this.gistId = id
    this.gistUrl = html_url
    await this.set(null, true, updated_at) // set update timestamp
  }

  async sync() {
    if (!this.github) { throw new Error('unable to sync gist: github credentials is not set') }
    const id = this.gistId
    if (!id) { throw new Error(`${this.filename}: please specify gist id first (directly or over .upload)`) }
    const { html_url, files, updated_at } = await this.github.gists.get({ id })
    this.gistUrl = html_url

    const { updated, data } = await this.get(true)
    const diff = (new Date(updated)).getTime() - (new Date(updated_at)).getTime()
    const result = {}

    if (diff > 0) { // local file is newer
      const config = { id: this.gistId, files: {} }
      config.files[this.filename] = { content: JSON.stringify(data, null, ' ') }
      const { updated_at } = await this.github.gists.edit(config)
      await this.set(null, true, updated_at)
      result.changed = 'remote'
      result.timestamp = new Date(updated_at)
    } else if (diff < 0) { // remote file is newer
      await this.set(JSON.parse(files[this.filename].content), false, updated_at)
      result.changed = 'local'
      result.timestamp = new Date(updated_at)
    } else {
      result.changed = 'none'
      result.timestamp = new Date(updated_at)
    }
    return result
  }
}

class Storage {
  constructor(config) {
    if (config.credentials) {
      this.github = new GitHubApi()
      this.github.authenticate(config.credentials)
    }
    if (!config.items) { throw new Error('storage items not set') }
    this.items = config.items
    this.path = config.path || `${process.env.HOME || process.env.USERPROFILE}/.config`

  }

  async init() {

    await mkdirpAsync(this.path)
    for (let item of this.items) {
      if (typeof item === 'string') {
        this[item] = new StorageItem(this.path, { name: item })
      } else {
        this[item.name] = new StorageItem(this.path, item, this.github)
      }
    }
  }

}

module.exports = Storage
//
// const storage = new Storage({
//   items: [{
//     name: 'users',
//     gistId: '77b3c0c1ee7f571a9642002b7b323b4d'
//   }, {
//     name: 'workshops'
//   }],
//   credentials: {
//     type: 'basic',
//     username: 'afoninsky',
//     password: '****'
//   }
// })
// storage.init().then(async () => {
//   const result = await storage.users.sync()
//   console.log(storage.users.gistUrl)
//   console.log(result)
//   console.log(await storage.users.get())
// })
