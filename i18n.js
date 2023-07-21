module.exports = {
  locales: ['en'],
  defaultLocale: 'en',
  pages: {
    '*': ['common'],
    '/': ['home'],
    '/login': ['login'],
    '/app/dashboard': ['dashboard'],
    '/app/upload': ['upload'],
    '/app/upload-success': ['upload-success'],
    '/app/unlock-subject': ['unlock-subject'],
    '/app/exam/[exam_id]': ['exam'],
    '/admin/validate': ['validate'],
  }
}
  