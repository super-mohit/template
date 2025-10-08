'use client'
import { LayoutDashboard, Settings, BotMessageSquare } from 'lucide-react'
import Link from 'next/link'

// Dummy NavLink component for demonstration
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
    >
        {children}
    </Link>
)

export function Sidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    {/* Placeholder for a logo icon */}
                    <span className="">Supervity</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <NavLink href="#">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </NavLink>
                    <NavLink href="#">
                        <BotMessageSquare className="h-4 w-4" />
                        Workbench
                    </NavLink>
                    <NavLink href="#">
                        <Settings className="h-4 w-4" />
                        Settings
                    </NavLink>
                </nav>
            </div>
        </div>
    </div>
  )
}
