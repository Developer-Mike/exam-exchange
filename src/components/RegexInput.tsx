import styles from '@/styles/RegexInput.module.scss'
import { ChangeEvent, useState } from "react"

export default function RegexInput({ id, label, partialRegex, regex, example, forceSuggestion, dropdownSuggestions }: {
  id: string,
  label: string,
  partialRegex?: RegExp,
  regex?: RegExp,
  example: string,
  forceSuggestion?: boolean,
  dropdownSuggestions?: RegexInputSuggestion[]
}) {
  const [value, setValue] = useState("")
  const [suggestions, setSuggestions] = useState<RegexInputSuggestion[]>(dropdownSuggestions || [])

  const updateInvalidState = (target: any) => {
    let label = target.parentElement?.querySelector("label") as HTMLLabelElement

    var validInput = true
    if (target.value !== "") {
      if (regex && !regex.test(target.value)) validInput = false

      if (dropdownSuggestions) {
        let dropdownSuggestionsValues = suggestions.map(suggestion => suggestion.value)

        if (forceSuggestion && !dropdownSuggestionsValues.includes(target.value)) validInput = false
        else if (dropdownSuggestionsValues.includes(target.value)) validInput = true
      }
    }

    if (validInput) label.classList.remove(styles.invalid)
    else label.classList.add(styles.invalid)
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
      else setSuggestions(dropdownSuggestions.filter((suggestion) => 
        suggestion.label.toLowerCase().includes(e.target.value.toLowerCase()) || 
        suggestion.value.toLowerCase().includes(e.target.value.toLowerCase())
      ))
    }
  }

  const acceptSuggestion = (e: any, suggestion: RegexInputSuggestion) => {
    let input = e.target.parentElement?.parentElement?.querySelector("input") as HTMLInputElement

    input.value = suggestion.value
    setValue(suggestion.value)

    setSuggestions([])
    updateInvalidState(input)
  }

  const suggestionKeyEvent = (e: any, suggestion: RegexInputSuggestion) => {
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
              
            {suggestion.label}
          </div>
        ) }
      </div>
    </div>
  )
}

export interface RegexInputSuggestion {
  value: string,
  label: string
}