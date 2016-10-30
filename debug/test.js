const GitHubApi = require('github')

class Gist {
  constructor(config) {
    const { credentials, gistId } = config

    this.github = new GitHubApi()
    this.github.authenticate(credentials)

    this.gistId = gistId
    this.gistUrl = null

    this.users = {}
    this.workshops = {}
  }

  async init() {
    if (this.gistId) {
      return await this.load()
    }
    return await this.create()
  }

  async load() {
    const { files, html_url } = await this.github.gists.get({ id: this.gistId })
    if (!files.users || !files.workshops) {
      console.warn(`gist ${this.gistId} found but have invalid format, rewriting`)
      await this.update()
      return await this.load()
    }
    this.users = JSON.parse(files.users.content)
    this.workshops = JSON.parse(files.workshops.content)
    this.gistUrl = html_url
  }

  async create() {
    const  { html_url, id } = await this.github.gists.create({
      files: {
        users: { content: JSON.stringify(this.users, null, ' ') },
        workshops: { content: JSON.stringify(this.workshops, null, ' ') }
      },
      public: false,
      description: 'nodeschool storage'
    })
    this.gistUrl = html_url
    this.gistId = id
  }

  async update() {
    const  { id } = await this.github.gists.edit({
      id: this.gistId,
      files: {
        users: { content: JSON.stringify(this.users, null, ' ') },
        workshops: { content: JSON.stringify(this.workshops, null, ' ') }
      }
    })
  }

}

;(async () => {
  const storage = new Gist({
    gistId: '087704ebb7e10ff2217e3841fd3dd042',
    credentials: {
      type: 'basic',
      username: 'afoninsky',
      password: 'mpdjx18w'
    }
  })
  await storage.init()
  console.log(storage.gistUrl)
})()
