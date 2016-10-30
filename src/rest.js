const GitHubApi = require('github')
const ld = require('lodash')

module.exports = (app, storage, package) => {
  return async ctx => {
    const { method, url } = ctx

    const hashed_token = ctx.headers.authorization
    const user = storage.gist.users[hashed_token]

    if (url === '/' && method === 'GET') {
      console.log('[] main page requested')
      return ctx.body = {
        name: package.name,
        version: package.version,
        mentors: ['qwe', 'asd'],
        auth: {
          client_secret: '11939218849e6cb05d7209405d124d657940e19c',
          client_id: 'f6515bd06aea0469a411',
          scopes: [],
          note: package.name,
          note_url: 'url from github'
        }
      }
    }

    if (url === '/auth' && method === 'POST') {
      console.log('[] auth requested')
      const { token, hashed_token } = ctx.request.body
      const github = new GitHubApi()

      github.authenticate({ token, type: 'token' })
      const user = await github.users.get({}) // 2do: valid handle responces
      storage.gist.users[hashed_token] = ld.pick(user, ['id', 'avatar_url', 'html_url', 'login'])
      await storage.update(storage.gist.users)
      console.log('[] user authentificated:', user.login)
      return ctx.body = { success: true }
    }

    if (url === '/workshop/current' && method === 'POST') {
      if (!user) {
        ctx.throw('GitHub auth required', 403)
      }
      const { workshop, task } = ctx.request.body
      const userWorkshops = storage.gist.workshops[hashed_token] = storage.gist.workshops[hashed_token] || {}
      userWorkshops.workhop = userWorkshops.workhop || {}
      userWorkshops.workhop.current = task
      await storage.update(storage.gist.workshops)
      return ctx.body = { success: true }
    }

    if (url === '/workshop/complete' && method === 'POST') {
      if (method !== 'POST') { return }
      if (!user) {
        ctx.throw('GitHub auth required', 403)
      }
      const { workshop, tasks } = ctx.request.body
      const userWorkshops = storage.gist.workshops[hashed_token] = storage.gist.workshops[hashed_token] || {}
      userWorkshops.workhop = userWorkshops.workhop || {}
      userWorkshops.workhop.completed = tasks
      await storage.update(storage.gist.workshops)
      return ctx.body = { success: true }
    }

  }
}
