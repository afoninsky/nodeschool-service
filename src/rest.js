const GitHubApi = require('github')
const ld = require('lodash')

module.exports = (app, storage, package) => {

  return async ctx => {
    const { method, url } = ctx

    const users = await storage.users.get()
    const hashed_token = ctx.headers.authorization
    const user = users[hashed_token]

    // display basic info
    if (url === '/' && method === 'GET') {
      return ctx.body = {
        name: package.name,
        version: package.version,
        user: user,
        auth: {
          client_secret: '11939218849e6cb05d7209405d124d657940e19c',
          client_id: 'f6515bd06aea0469a411',
          scopes: [],
          note: package.name,
          note_url: package.homepage
        }
      }
    }

    // auth user and save session
    if (url === '/auth' && method === 'POST') {
      console.log('[] auth requested')
      const { token, hashed_token } = ctx.request.body
      const github = new GitHubApi()
      github.authenticate({ token, type: 'token' })
      const userInfo = await github.users.get({})
      const users = await storage.users.get()
      const user = {}
      user[hashed_token] = ld.pick(userInfo, ['id', 'avatar_url', 'html_url', 'login'])
      await storage.users.set(user, true) // append to existing users
      console.log('[] user authentificated:', user.login)
      return ctx.body = { success: true }
    }

    // set current active workshop task
    if (url === '/workshop/active' && method === 'POST') {
      if (!user) {
        ctx.throw('GitHub auth required', 403)
      }
      const { workshop, task } = ctx.request.body
      const workshops = storage.workshops.get()
      const data = {}
      data[user.id] = data[user.id] || {}
      data[user.id].active = { workshop, task, updated: new Date() }
      await storage.workshops.set(data, true)
      return ctx.body = { success: true }
    }

    // set completed tasks in workshop
    if (url === '/workshop/completed' && method === 'POST') {
      if (!user) {
        ctx.throw('GitHub auth required', 403)
      }
      const { workshop, tasks } = ctx.request.body
      const workshops = storage.workshops.get()
      const data = {}
      data[user.id] = data[user.id] || {}
      data[user.id].progress = data[user.id].progress || {}
      data[user.id].progress[workshop] = {
        completed: tasks,
        updated: new Date()
      }
      await storage.workshops.set(data, true)
      return ctx.body = { success: true }
    }

  }
}
