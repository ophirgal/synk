import { Outlet, useMatch } from "react-router"
import { Toaster } from "sonner"
import { Menu } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

export default function Layout() {
    const isRoomPage = useMatch("/rooms/*")

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/", label: "Pricing" },
        { href: "/", label: "FAQ" },
        { href: "/", label: "Contact" },
    ]

    return (
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="flex items-center justify-between px-8 h-[75px]">
                <a href="/" className="text-5xl font-bold no-underline text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors">[synk]</a>

                {isRoomPage ? (
                    <div className="flex items-center justify-end gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Menu className="cursor-pointer rounded hover:bg-indigo-50 active:text-indigo-500 h-8 w-8 text-indigo-500" />
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[250px]">
                                <SheetHeader>
                                    <SheetTitle>Menu</SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 mt-6">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            className="text-lg text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>

                    </div>
                ) : (
                    <nav className="flex justify-end gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-indigo-500 hover:text-indigo-400 active:text-indigo-600"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                )}
            </header>
            <main className={`flex-8 min-h-[600px]`}>
                <Outlet />
                <Toaster expand visibleToasts={10} />
            </main>
            {!isRoomPage &&
                <footer className="flex-1 flex text-gray-400 items-center justify-center">
                    <p>&copy; 2026 synk.<br />All rights reserved.</p>
                </footer>
            }
        </div>
    )
}
