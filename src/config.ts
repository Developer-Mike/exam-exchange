export const schoolName = "Random School"
export const mailRegex = /^[a-z]+\.[a-z]+@gmail\.com$/

export const topicRegex = /^[A-Z0-1][A-Za-z0-9\-\. ]+$/
export const partialTopicRegex = /^(?:[A-Z0-1]|$)[A-Za-z0-9\-\. ]*$/
export const subjectRegex = /^[A-Z][A-Za-z ]+$/
export const partialSubjectRegex = /^(?:[A-Z]|$)[A-Za-z ]*$/
export const teacherRegex = /^[A-Z]{3}$/
export const partialTeacherRegex = /^[A-Z]{0,3}$/
export const classRegex = /^[NK][1-4][A-Z]$/
export const partialClassRegex = /^(?:[NK]|$)(?:[1-4]|$)(?:[A-Z]|$)$/
export const yearRegex = /^20[0-9]{2}$/
export const partialYearRegex = /^(?:2|$)(?:0|$)([0-9]{0,2})$/