// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  routeRules: {
    // Use these to make redirects, etc.
    '/': { redirect: '/bibs' }
  },
  runtimeConfig: {
    // override this on the command line with NUXT_API_URL="foo" or 
    // set it in a .env file
    apiUrl: 'http://localhost:5000/api'
  }
})
