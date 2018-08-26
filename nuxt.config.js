module.exports = {
  head: {
    title: 'cloudmovie',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Edit the web. Hit play.' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
    ]
  },
  loading: {
    color: '#FF7171',
    height: '4px'
  },
  modules: [
    ['nuxt-i18n', {
      locales: ['en', 'tw'],
      defaultLocale: 'tw',
      vueI18nLoader: true,
      detectBrowserLanguage: {
        useCookie: true,
        cookieKey: 'i18n_redirected'
      }
    }]
  ],
  build: {
    /*
    ** Run ESLint on save
    */
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
