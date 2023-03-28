import styles from '@/styles/RegexInput.module.scss'
import { ChangeEvent, useState } from "react"

export default function RegexInput({ id, label, partialRegex, regex, example, forceSuggestion, dropdownSuggestions }: {
  id: string,
  label: string,
  partialRegex?: RegExp,
  regex?: RegExp,
  example: string,
  forceSuggestion?: boolean,
  dropdownSuggestions?: string[]
}) {
  const [value, setValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (partialRegex) {
      let newValue = e.target.value
      if (partialRegex.test(newValue)) {
        setValue(newValue)
      } else {
        var lastChar = newValue.substring(newValue.length - 1)
        if (lastChar.toUpperCase() != lastChar) lastChar = lastChar.toUpperCase()
        else lastChar = lastChar.toLowerCase()
        let newValueModified = newValue.substring(0, newValue.length - 1) + lastChar
        if (partialRegex.test(newValueModified)) {
          e.target.value = newValueModified
          setValue(newValueModified)
        } else {
          e.target.value = value
        }
      }
    }

    if (regex) {
      let label = e.target.parentElement?.querySelector("label") as HTMLLabelElement
      if (regex.test(e.target.value) || e.target.value === "" || (forceSuggestion && !dropdownSuggestions?.includes(e.target.value))) label.classList.remove(styles.invalid)
      else label.classList.add(styles.invalid)
    }

    if (dropdownSuggestions) {
      if (e.target.value === "") setSuggestions(dropdownSuggestions)
      else setSuggestions(dropdownSuggestions.filter((suggestion) => suggestion.includes(e.target.value)))
    }
  }

  const acceptSuggestion = (e: any, suggestion: string) => {
    let input = e.target.parentElement?.parentElement?.querySelector("input") as HTMLInputElement
    input.value = suggestion
    setValue(suggestion)
    setSuggestions([])
  }

  return (
    <div className={styles.regexInputContainer}>
      <label className={styles.regexInputLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.regexInput} type="text" onChange={onChange} placeholder={example}/>
      <div className={styles.regexInputDropdown}>
        { suggestions.map((suggestion) => 
          <div className={styles.regexInputDropdownItem} onClick={e => acceptSuggestion(e, suggestion)}>{suggestion}</div>
        ) }
      </div>
    </div>
  )
}