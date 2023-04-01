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
  const [suggestions, setSuggestions] = useState<string[]>(dropdownSuggestions || [])

  const updateInvalidState = (target: any) => {
    if (regex) {
      let label = target.parentElement?.querySelector("label") as HTMLLabelElement
      if (target.value !== "" && (!regex.test(target.value) || (forceSuggestion && !dropdownSuggestions?.includes(target.value)))) label.classList.add(styles.invalid)
      else label.classList.remove(styles.invalid)
    }
  }

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

    updateInvalidState(e.target)

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
    updateInvalidState(input)
  }

  const suggestionKeyEvent = (e: any, suggestion: string) => {
    if (e.key === "Enter") {
      acceptSuggestion(e, suggestion)
    }
  }

  return (
    <div className={styles.regexInputContainer}>
      <label className={styles.regexInputLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.regexInput} type="text" onChange={onChange} placeholder={example}/>
      <div className={styles.regexInputDropdown}>
        { suggestions.map((suggestion, index) => 
          <div key={index} tabIndex={0} className={styles.regexInputDropdownItem} 
            onKeyUp={e => suggestionKeyEvent(e, suggestion)} 
            onClick={e => acceptSuggestion(e, suggestion)}>
              
            {suggestion}
          </div>
        ) }
      </div>
    </div>
  )
}