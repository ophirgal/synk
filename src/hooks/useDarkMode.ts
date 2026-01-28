import { useEffect } from "react"
import useMediaQuery from "./useMediaQuery"
import { useLocalStorage } from "./useStorage"

export default function useDarkMode() {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
    const [isDarkMode, setIsDarkMode] = useLocalStorage("useDarkMode", prefersDarkMode)

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDarkMode])

    return { isDarkMode, setIsDarkMode }
}