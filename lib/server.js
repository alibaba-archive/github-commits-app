/**
 * 关联插件示例：GitHub Commits 关联
 * 查询个人 repository 列表，加载 Commits 列表，并关联到 Teambition 对象中
 */
'use strict'

const config = require('../config')
const Koa = require('koa')
const router = require('koa-router')()
const request = require('request-promise')
const auth = require('./auth')

const app = new Koa()

// User-Agent 可随意配置，但是必须的
const headers = {
  'User-Agent': config.git.user,
  Authorization: 'Basic ' + new Buffer(config.git.user + ':' + config.git.token).toString('base64')
}

// 加载菜单项目
router.get('/themes', function * () {
  let data = yield request({
    method: 'GET',
    url: 'https://api.github.com/user/repos',
    json: true,
    headers: headers
  }).then(function (body) {
    return body.map(function (repository) {
      return {
        title: repository.name,
        itemsUrl: config.host + `/themes/${repository.owner.login}/${repository.name}/commits`
      }
    })
  })
  this.body = data
})

// 加载每个菜单下的关联项目
router.get('/themes/:owner/:repo/commits', function * () {
  let url = `https://api.github.com/repos/${this.params.owner}/${this.params.repo}/commits`
  // 在 url 中添加分页参数，如果不支持分页则忽略
  if (this.request.query.count && this.request.query.page) {
    url += `?page=${this.request.query.page}&count=${this.request.query.count}`
  }
  let data = yield request({
    method: 'GET',
    url: url,
    json: true,
    headers: headers
  }).then(function (body) {
    return body.map(function (commit) {
      let data = {
        title: commit.commit.message,
        redirectUrl: commit.html_url
      }
      return data
    })
  })
  this.body = data
})

// 可选：加载权限验证中间件
// 通过 header X-Teambition-Sign 验证 Teambition 用户 id
app.use(auth({
  clientId: config.app.client_id,
  clientSecret: config.app.client_secret
}))

app.use(router.routes())

app.listen(8080, function () {
  console.log('Server listen on 8080')
})
