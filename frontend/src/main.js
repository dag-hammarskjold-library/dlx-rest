import { createApp } from 'vue'
import AppStage from './components/AppStage.vue'
import { User } from './api/user.js'
import { Jmarc } from './api/jmarc.js'
import './e3.css'

const mount = document.getElementById('editor')
const apiPrefix = mount.dataset.apiPrefix
const username = mount.dataset.username
const records = mount.dataset.records || ''

User.apiUrl = apiPrefix
Jmarc.apiUrl = apiPrefix

const currentUser = new User(username)
await currentUser.loadBasket()
await currentUser.loadUserProfile()

createApp(AppStage, {
  api_prefix: apiPrefix,
  records,
  user: currentUser
}).mount(mount)
