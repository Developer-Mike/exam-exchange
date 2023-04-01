export const schoolName = "Random School"
export const mailRegex = /^[a-z]+\.[a-z]+@gmail\.com$/

export const topicRegex = /^[A-Z0-1][A-Za-z0-9\-\. ]+$/
export const partialTopicRegex = /^(?:[A-Z0-1]|$)[A-Za-z0-9\-\. ]*$/
export const subjectRegex = /^[A-Z][A-Za-z ]+$/
export const partialSubjectRegex = /^(?:[A-Z]|$)[A-Za-z ]*$/
export const teacherRegex = /^[A-Z][a-z][A-Z]$/
export const partialTeacherRegex = /^(?:[A-Z]|$)(?:[a-z]|$)(?:[A-Z]|$)$/
export const classRegex = /^[NK][1-4][A-Z]$/
export const partialClassRegex = /^(?:[NK]|$)(?:[1-4]|$)(?:[A-Z]|$)$/
const year = new Date().getFullYear().toString()
export const yearRegex = new RegExp(`^${year.substring(0, 2)}(([0-${parseInt(year.charAt(2)) - 1}][0-9])|(${year.charAt(2)}[0-${year.charAt(3)}]))$`) // 2000 - This year
export const partialYearRegex = new RegExp(`^(?:${year.charAt(0)}|$)(?:${year.charAt(1)}|$)(((?:[0-${parseInt(year.charAt(2)) - 1}]|$)(?:[0-9]|$))|((?:${year.charAt(2)}|$)(?:[0-${year.charAt(3)}]|$)))$`) // 2000 - This year

export const maxImageCount = 10
export const maxImageSize = 1024 * 1024 // 1 MB