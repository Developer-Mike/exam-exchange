import { mailRegex } from "@/config"

export function isEmailValid(email: string): boolean {
  return email.match(mailRegex) != null
}

export function getFirstName(email: string): string {
  let firstName = email.split(".")[0]
  return firstName.charAt(0).toUpperCase() + firstName.slice(1)
}

export function getAvatar(seed: string): string {
  return `https://api.dicebear.com/5.x/avataaars-neutral/svg?seed=${encodeURIComponent(seed)}`
      + "&backgroundColor=f8d25c"
      + "&eyebrows=default,defaultNatural,flatNatural,frownNatural,raisedExcited,raisedExcitedNatural,upDown,upDownNatural"
      + "&eyes=default,eyeRoll,happy,side,squint,surprised,wink,winkWacky&mouth=default,serious,smile,tongue,twinkle"
}