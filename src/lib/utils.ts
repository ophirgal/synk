import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function createRoomLink(roomId: string) {
  return window.location.origin + "/rooms/" + roomId
}

export {
  cn,
  createRoomLink
};