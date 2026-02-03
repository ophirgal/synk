import { useState } from "react"
import { Link, Outlet, useMatch, useNavigate, useLocation } from "react-router"
import { Toaster } from "sonner"
import { Menu } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import { navLinks } from "@/constants/constants"
import { useTheme } from "@/context/ThemeContext"

export default function Layout() {
    const { isDarkMode } = useTheme()
    const isRoomPage = useMatch("/rooms/*")
    const screenHeight = isRoomPage ? "h-screen" : "min-h-screen"
    const shouldShowHeader = !isRoomPage
    const shouldShowFooter = !isRoomPage
    const [sheetOpen, setSheetOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const handleNavClick = (e: React.MouseEvent, href: string) => {
        if (!href.startsWith("#")) return

        e.preventDefault()
        const id = href.slice(1)

        if (location.pathname === "/") {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        } else {
            navigate("/" + href)
        }

        setSheetOpen(false)
    }

    return (
        <div className={`flex flex-col ${screenHeight} w-screen bg-gradient-to-br dafrom-blue-50 to-indigo-100 dark:from-black dark:to-indigo-800`}>
            {shouldShowHeader &&
                <header className="flex items-center justify-between px-4 sm:px-8 h-[60px] sm:h-[75px]">
                    <Link to="/" className="text-3xl sm:text-5xl font-bold no-underline text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 active:text-indigo-600 transition-colors select-none">[synk]</Link>

                    <nav className="hidden sm:flex justify-end gap-3 sm:gap-6 text-sm sm:text-base">
                        {navLinks.map((link) =>
                            link.href.startsWith("#") ? (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    className="text-indigo-500 dark:text-indigo-100 hover:text-indigo-400 active:text-indigo-600 cursor-pointer"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className="text-indigo-500 dark:text-indigo-100 hover:text-indigo-400 active:text-indigo-600"
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                    </nav>
                    <div className="sm:hidden">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Menu className="cursor-pointer rounded text-indigo-500 hover:text-indigo-400 h-8 w-8 ml-2" />
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[250px]">
                                <SheetHeader>
                                    <SheetTitle></SheetTitle>
                                    <SheetDescription></SheetDescription>
                                </SheetHeader>
                                <nav className="flex flex-col gap-8 mt-6">
                                    {navLinks.map((link) =>
                                        link.href.startsWith("#") ? (
                                            <a
                                                key={link.label}
                                                href={link.href}
                                                onClick={(e) => handleNavClick(e, link.href)}
                                                className="text-3xl text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors cursor-pointer"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                key={link.label}
                                                to={link.href}
                                                onClick={() => setSheetOpen(false)}
                                                className="text-3xl text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>
            }
            <main className={`flex-8 min-h-[600px]`}>
                <Outlet />
                <Toaster expand visibleToasts={10} theme={isDarkMode ? "dark" : "light"} />
            </main>
            {
                shouldShowFooter &&
                <footer className="flex-1 flex text-gray-400 items-center justify-center px-4 text-sm sm:text-base mb-32">
                    <p>Made with 💜 by Ophiri.<br />&copy; 2026 [synk].<br />All rights reserved.</p>
                </footer>
            }
        </div >
    )
}
