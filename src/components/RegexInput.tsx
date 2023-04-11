import styles from '@/styles/RegexInput.module.scss'
import { ChangeEvent, useEffect, useState } from "react"

export interface RegexInputSuggestion {
  value: string,
  label: string
}

export default function RegexInput({ id, label, partialRegex, regex, example, value, forceSuggestion, dropdownSuggestions, disabled }: {
  id: string,
  label: string,
  partialRegex?: RegExp,
  regex?: RegExp,
  example: string,
  value?: string,
  forceSuggestion?: boolean,
  dropdownSuggestions?: RegexInputSuggestion[], 
  disabled?: boolean
}) {
  const [currentValue, setCurrentValue] = useState("")
  const [suggestions, setSuggestions] = useState<RegexInputSuggestion[]>(dropdownSuggestions || [])

  const updateInvalidState = (target: any) => {
    let label = target.parentElement?.querySelector("label") as HTMLLabelElement

    var validityState: "valid" | "unknown" | "invalid" = "valid"
    if (target.value !== "") {
      if (regex && !regex.test(target.value)) validityState = "invalid"

      if (dropdownSuggestions) {
        let dropdownSuggestionsValues = suggestions.map(suggestion => suggestion.value)
        let includedInSuggestions = dropdownSuggestionsValues.includes(target.value)

        if (forceSuggestion && !includedInSuggestions) validityState = "invalid"
        else if (!forceSuggestion && !includedInSuggestions) validityState = "unknown"
        else if (includedInSuggestions) validityState = "valid"
      }
    }

    label.setAttribute("data-validity", validityState)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (partialRegex) {
      let newValue = e.target.value
      if (partialRegex.test(newValue)) {
        setCurrentValue(newValue)
      } else {
        var lastChar = newValue.substring(newValue.length - 1)
        if (lastChar.toUpperCase() != lastChar) lastChar = lastChar.toUpperCase()
        else lastChar = lastChar.toLowerCase()
        let newValueModified = newValue.substring(0, newValue.length - 1) + lastChar
        if (partialRegex.test(newValueModified)) {
          e.target.value = newValueModified
          setCurrentValue(newValueModified)
        } else {
          e.target.value = currentValue
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
    setCurrentValue(suggestion.value)

    setSuggestions([])
    updateInvalidState(input)
  }

  const suggestionKeyEvent = (e: any, suggestion: RegexInputSuggestion) => {
    if (e.key === "Enter") {
      acceptSuggestion(e, suggestion)
    }
  }

  useEffect(() => {
    if (value) {
      let input = document.getElementById(id) as HTMLInputElement

      if (input) {
        input.value = value
        setCurrentValue(value)
        updateInvalidState(input)
      }
    }
  }, [])

  return (
    <div className={styles.regexInputContainer}>
      <label className={styles.regexInputLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.regexInput} type="text" onInput={onChange} placeholder={example} autoComplete="off" disabled={disabled}/>
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

export function setRegexInputValue(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
}