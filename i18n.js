module.exports = {
  locales: ['en', 'de'],
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
    '/app/browse/[subject_id]': ['browse'],
    '/admin/validate': ['validate'],
  }
}
  