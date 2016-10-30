const GitHubApi = require('github')

class Gist {
  constructor(config) {
    const { credentials, userGist, workshopGist } = config

    this.github = new GitHubApi()
    this.github.authenticate(credentials)

    this.gist = {
      users: { id: userGist, url: null, data: {}, filename: 'users.json', description: 'Workshopers credentials' },
      workshops: { id: workshopGist, url: null, data: {}, filename: 'workshops.json', desctiption: 'User workshops progress' }
    }
  }

  async init() {

    if (this.gist.users.id) {
      await this.load(this.gist.users)
    } else {
      await this.create(this.gist.users)
    }

    if (this.gist.workshops.id) {
      await this.load(this.gist.workshops)
    } else {
      await this.create(this.gist.workshops)
    }

  }

  async load(gist) {
    const { files, html_url } = await this.github.gists.get({ id: gist.id })
    if (!files[gist.filename]) {
      console.warn(`gist ${gist.id} found but have invalid format, rewriting`)
      await this.update(gist)
      return await this.load(gist)
    }
    gist.data = JSON.parse(files[gist.filename].content)
    gist.url = html_url
  }

  async create(gist) {
    const config = { files: {}, public: false}
    config.files[gist.filename] = { content: JSON.stringify(gist.data, null, ' ') }
    const { id, html_url } = await this.github.gists.create(config)
    gist.url = html_url
    gist.id = id
    console.log(`Gist ${gist.url} (${gist.filename}) created`)
  }

  async update(gist) {
    const config = {}
    config.id = gist.id
    config.files = {}
    config.files[gist.filename] = { content: JSON.stringify(gist.data, null, ' ') }
    const { id } = await this.github.gists.edit(config)
  }

}

module.exports = Gist
