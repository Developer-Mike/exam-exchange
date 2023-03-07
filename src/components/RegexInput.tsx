import styles from '@/styles/RegexInput.module.scss'
import { ChangeEvent, useState } from "react"

export default function RegexInput({ id, label, regex, example }: {
  id: string,
  label: string,
  regex?: RegExp,
  example: string
}) {
  const [value, setValue] = useState("")

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (regex) {
      let newValue = e.target.value
      if (regex.test(newValue)) {
        setValue(newValue)
        return
      }

      var lastChar = newValue.substring(newValue.length - 1)
      if (lastChar.toUpperCase() != lastChar) lastChar = lastChar.toUpperCase()
      else lastChar = lastChar.toLowerCase()
      let newValueModified = newValue.substring(0, newValue.length - 1) + lastChar
      if (regex.test(newValueModified)) {
        e.target.value = newValueModified
        setValue(newValueModified)
        return
      }
    }

    e.target.value = value
  }

  return (
    <div className={styles.regexInputContainer}>
      <label className={styles.regexInputLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.regexInput} type="text" onChange={onChange} placeholder={example}/>
    </div>
  )
}