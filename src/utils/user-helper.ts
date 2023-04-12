import { mailRegex } from "@/config"

export function isEmailValid(email: string): boolean {
  return email.match(mailRegex) != null
}

export function getFirstName(email: string): string {
  let firstName = email.split(".")[0]
  return firstName.charAt(0).toUpperCase() + firstName.slice(1)
}