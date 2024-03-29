export const adminEmails = [/^m[a-z]+\.s[a-z]+@gmail\.com$/]

export const schoolName = "Name of School"
export const mailRegex = /^[a-z]+\.[a-z]+@[a-z]+\.com$/

export const nameRegex = /^[A-ZÖÄÜ][a-zöäü]+$/
export const partialNameRegex = /^(?:[A-ZÖÄÜ]|$)[a-zöäü]*$/

export const topicRegex = /^[A-Z0-1ÖÄÜ][A-Za-z0-9\-\. öäüÖÄÜ]+$/
export const partialTopicRegex = /^(?:[A-Z0-1ÖÄÜ]|$)[A-Za-z0-9\-\. öäüÖÄÜ]*$/
export const subjectRegex = /^[A-ZÖÄÜ][A-Za-zöäüÖÄÜ ]+$/
export const partialSubjectRegex = /^(?:[A-ZÖÄÜ]|$)[A-Za-zöäüÖÄÜ ]*$/
export const teacherAbbreviationRegex = /^[A-ZÖÄÜ][a-zöäü][A-ZÖÄÜ]$/
export const partialTeacherAbbreviationRegex = /^(?:[A-ZÖÄÜ]|$)(?:[a-zöäü]|$)(?:[A-ZÖÄÜ]|$)$/
export const classRegex = /^[AF][1-4][A-Z]$/
export const partialClassRegex = /^(?:[AF]|$)(?:[1-4]|$)(?:[A-Z]|$)$/
const year = new Date().getFullYear().toString()
export const yearRegex = new RegExp(`^${year.substring(0, 2)}(([0-${parseInt(year.charAt(2)) - 1}][0-9])|(${year.charAt(2)}[0-${year.charAt(3)}]))$`) // 2000 - This year
export const partialYearRegex = new RegExp(`^(?:${year.charAt(0)}|$)(?:${year.charAt(1)}|$)(((?:[0-${parseInt(year.charAt(2)) - 1}]|$)(?:[0-9]|$))|((?:${year.charAt(2)}|$)(?:[0-${year.charAt(3)}]|$)))$`) // 2000 - This year
export const maxImageCount = 10
export const maxImageSize = 1024 * 1024 // 1 MB

export const browsePageExamCount = 50

export const subjectUnlockDuration = 30 // Only for client side display
export const banDuration = `${24 * 365}h` // 1 year