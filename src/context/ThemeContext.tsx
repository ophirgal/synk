import useDarkMode from "@/hooks/useDarkMode"
import { createContext, useContext } from "react"

export type ThemeContextType = {
    isDarkMode: boolean
    setIsDarkMode: (isDarkMode: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    setIsDarkMode: () => {}
})

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isDarkMode, setIsDarkMode } = useDarkMode()

    return (
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
