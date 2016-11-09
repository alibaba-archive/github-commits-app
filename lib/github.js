'use strict'
const router = require('koa-router')()
const jsoner = require('./jsoner')
const config = require('../config')
const request = require('request-promise')

const redirectUri = config.host + config.git.redirect_uri

// 授权地址
router.get('/github/auth', function * () {
  let authUrl = `https://github.com/login/oauth/authorize?client_id=${config.git.client_id}&redirect_uri=${redirectUri}&scope=repo`
  this.redirect(authUrl)
})

// 获取 token 并保存 token
router.get('/github/callback', function * () {
  let data = yield request({
    method: 'POST',
    url: 'https://github.com/login/oauth/access_token',
    json: true,
    form: {
      client_id: config.git.client_id,
      client_secret: config.git.client_secret,
      code: this.query.code,
      redirect_uri: redirectUri
    }
  })
  if (data.access_token) jsoner.writeJSONFile(data)
  this.body = 'Successful, please back to teambition and try again.'
})

module.exports = router
