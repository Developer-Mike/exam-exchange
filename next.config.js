const path = require('path')
const nextTranslate = require('next-translate-plugin')

module.exports = nextTranslate({
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'src', 'styles')],
    prependData: `
      @import "./variables.scss";
    `,
  }
})
