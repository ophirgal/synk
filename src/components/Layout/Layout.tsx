import { Outlet, useMatch } from "react-router"
import { Toaster } from "sonner"

import { navLinks } from "@/constants/constants"

export default function Layout() {
    const isRoomPage = useMatch("/rooms/*")
    const shouldShowHeader = !isRoomPage
    const shouldShowFooter = !isRoomPage

    return (
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br dafrom-blue-50 to-indigo-100 dark:from-black dark:to-indigo-800">
            {shouldShowHeader &&
                <header className="flex items-center justify-between px-8 h-[75px]">
                    <a href="/" className="text-5xl font-bold no-underline text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 active:text-indigo-600 transition-colors select-none">[synk]</a>

                    <nav className="flex justify-end gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-indigo-500 dark:text-indigo-100 hover:text-indigo-400 active:text-indigo-600"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </header>
            }
            <main className={`flex-8 min-h-[600px]`}>
                <Outlet />
                <Toaster expand visibleToasts={10} />
            </main>
            {shouldShowFooter &&
                <footer className="flex-1 flex text-gray-400 items-center justify-center">
                    <p>&copy; 2026 synk.<br />All rights reserved.</p>
                </footer>
            }
        </div>
    )
}
