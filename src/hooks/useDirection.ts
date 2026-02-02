import { useLocalStorage } from "./useStorage"

export default function useDirection() {
    const [direction, setDirection] = useLocalStorage("useDirection", "ltr")

    return { direction, setDirection }
}