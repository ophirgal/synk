import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateId } from "zoo-ids";

import { animalNames } from "../constants/constants";

const generateUsername = () => {
  let username = generateId(Math.random(), {
    numAdjectives: 1,
    delimiter: ' ',
    caseStyle: 'titlecase'
  })
  const parts = username.split(' ')
  parts[1] = animalNames[Math.floor(Math.random() * animalNames.length)]
  username = parts.join(" ")
  return username
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export {
  cn,
  generateUsername
};