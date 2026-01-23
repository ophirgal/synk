import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

import "./Layout.css"

export default function Layout() {
    return (
        <div className="layout bg-gradient-to-br from-blue-50 to-indigo-100">
            <header>
                <a href="/" className="text-5xl font-bold no-underline text-indigo-500 hover:text-indigo-400 active:text-indigo-600 transition-colors">[synk]</a>
                <nav className="flex justify-end gap-6">
                    <a href="/" className="text-indigo-500 hover:text-indigo-400 active:text-indigo-600">Home</a>
                    <a href="/" className="text-indigo-500 hover:text-indigo-400 active:text-indigo-600">Pricing</a>
                    <a href="/" className="text-indigo-500 hover:text-indigo-400 active:text-indigo-600">FAQ</a>
                    <a href="/" className="text-indigo-500 hover:text-indigo-400 active:text-indigo-600">Contact</a>
                </nav>
            </header>
            <main>
                <Outlet />
                <Toaster expand />
            </main>
            <footer className="text-gray-400 ">
                <p>&copy; 2026 synk.<br />All rights reserved.</p>
            </footer>
        </div>
    )
}
