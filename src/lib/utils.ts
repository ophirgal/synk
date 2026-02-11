import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateId } from "zoo-ids";

import { ANIMAL_NAMES } from "@/constants/constants";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const generateAvatarAndDisplayName = (): [string, string] => {
  const id = generateId(Math.random(), {
    numAdjectives: 1,
    delimiter: ' ',
    caseStyle: 'titlecase'
  })
  const parts = id.split(' ')
  parts[1] = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)]
  const avatar = parts[1]
  const displayName = parts.join(" ")
  return [avatar, displayName]
}

function getRemoteVideoElementId(connectionId: string): string {
  return `remote-video-${connectionId}`;
}

function getRemoteAudioElementId(connectionId: string): string {
  return `remote-audio-${connectionId}`;
}

export {
  cn,
  generateAvatarAndDisplayName,
  getRemoteVideoElementId,
  getRemoteAudioElementId
};