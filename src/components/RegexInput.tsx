import styles from '@/styles/RegexInput.module.scss'
import { ChangeEvent, useEffect, useState } from "react"

export interface RegexInputSuggestion {
  value: string,
  label: string
}
export function SimpleInputSuggestion(suggestion: string): RegexInputSuggestion {
  return { value: suggestion, label: suggestion }
}
export function SimpleInputSuggestions(suggestions: string[]): RegexInputSuggestion[] {
  return suggestions.map(suggestion => SimpleInputSuggestion(suggestion))
}

export interface RegexInputRef {
  getValue: () => string
  setValue: (value: string) => void
  isValid: () => boolean
  setSuggestions: (suggestions: RegexInputSuggestion[]) => void
  setDisabled: (disabled: boolean) => void
}

export default function RegexInput({ reference, id, label, partialRegex, regex, example, forceSuggestion, dropdownSuggestions, disabled }: {
  reference?: React.MutableRefObject<RegexInputRef|undefined>,
  id: string,
  label: string,
  partialRegex?: RegExp,
  regex?: RegExp,
  example: string,
  forceSuggestion?: boolean,
  dropdownSuggestions?: RegexInputSuggestion[], 
  disabled?: boolean
}) {
  const [_currentValue, setCurrentValue] = useState("")
  const getCurrentValue = () => _currentValue != "" ? _currentValue : (document.getElementById(id) as HTMLInputElement).value

  const [suggestions, setSuggestions] = useState<RegexInputSuggestion[] | undefined>(dropdownSuggestions)
  const [currentSuggestions, setCurrentSuggestions] = useState<RegexInputSuggestion[]>([])
  const [disabledState, setDisabledState] = useState(disabled || false)

  const setRegexInputValue = (input: HTMLInputElement, value: string) => {
    input.value = value
    input.dispatchEvent(new Event("input", { bubbles: true }))
  }

  const updateInvalidState = (target: any) => {
    let label = target.parentElement?.querySelector("label") as HTMLLabelElement

    var validityState: "valid" | "unknown" | "invalid" = "valid"
    if (target.value !== "") {
      if (regex && !regex.test(target.value)) validityState = "invalid"

      if (suggestions) {
        let dropdownSuggestionsValues = suggestions.map(suggestion => suggestion.value)
        let includedInSuggestions = dropdownSuggestionsValues.includes(target.value)

        if (forceSuggestion && !includedInSuggestions) validityState = "invalid"
        else if (!forceSuggestion && !includedInSuggestions) validityState = "unknown"
        else if (includedInSuggestions) validityState = "valid"
      }
    }

    label.setAttribute("data-validity", validityState)
  }

  const updateSuggestions = (target: any) => {
    if (!suggestions) return

    if (target.value === "") setCurrentSuggestions(suggestions)
    else setCurrentSuggestions(suggestions.filter((suggestion) => 
      (suggestion.label.toLowerCase().includes(target.value.toLowerCase()) || 
      suggestion.value.toLowerCase().includes(target.value.toLowerCase())) &&
      suggestion.value != target.value
    ))
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
          e.target.value = getCurrentValue()
        }
      }
    }

    updateInvalidState(e.target)
    updateSuggestions(e.target)
  }

  const acceptSuggestion = (e: any, suggestion: RegexInputSuggestion) => {
    let input = e.target.parentElement?.parentElement?.querySelector("input") as HTMLInputElement
    setRegexInputValue(input, suggestion.value)
  }

  const suggestionKeyEvent = (e: any, suggestion: RegexInputSuggestion) => {
    if (e.key === "Enter") acceptSuggestion(e, suggestion)
  }

  useEffect(() => {
    if (reference) {
      reference.current = {
        getValue: () => {
          return getCurrentValue()
        },
        setValue: (value: string) => {
          let input = document.getElementById(id) as HTMLInputElement
          if (input) setRegexInputValue(input, value)
        },
        isValid: () => {
          return regex ? regex.test(getCurrentValue()) : true
        },
        setSuggestions: (suggestions: RegexInputSuggestion[]) => {
          setSuggestions(suggestions)
          updateSuggestions(document.getElementById(id))
        },
        setDisabled: (disabled: boolean) => {
          setDisabledState(disabled)
        }
      }
    }

    let input = document.getElementById(id) as HTMLInputElement
    if (input) {
      let suggestionsContainer = input.parentElement?.querySelector(`.${styles.regexInputDropdown}`) as HTMLDivElement
      if (suggestionsContainer) {
        suggestionsContainer.style.width = input.offsetWidth + "px"
        suggestionsContainer.style.fontSize = window.getComputedStyle(input).fontSize
      }

      updateInvalidState(input)
      updateSuggestions(input)
    }
  }, [])

  return (
    <div className={styles.regexInputContainer}>
      <label className={styles.regexInputLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.regexInput} type="text" onInput={onChange} placeholder={example} autoComplete="off" disabled={disabledState}/>
      <div className={styles.regexInputDropdown}>
        { currentSuggestions.map((suggestion, index) => 
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