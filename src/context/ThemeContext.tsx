import useDarkMode from "@/hooks/useDarkMode"
import useDirection from "@/hooks/useDirection"
import { createContext, useContext } from "react"

export type ThemeContextType = {
    isDarkMode: boolean
    setIsDarkMode: (isDarkMode: boolean) => void
    direction: "ltr" | "rtl"
    setDirection: (direction: "ltr" | "rtl") => void
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    setIsDarkMode: () => { },
    direction: "ltr",
    setDirection: () => { },
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isDarkMode, setIsDarkMode } = useDarkMode()
    const { direction, setDirection } = useDirection()

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, direction, setDirection }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
