import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateId } from "zoo-ids";

const generateUsername = () => generateId(Math.random(), {
  numAdjectives: 1,
  delimiter: ' ',
  caseStyle: 'titlecase'
})

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export {
  cn,
  generateUsername
};