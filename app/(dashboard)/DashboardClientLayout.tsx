'use client';

import Link from "next/link";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Users, PhoneForwarded, BookUser, Calendar, CreditCard, ChevronsLeft, ChevronsRight, Voicemail, Beaker, FileText } from 'lucide-react';
import UserProfile from "@/components/dashboard/UserProfile";
import { Toaster } from 'sonner';
import { User } from "next-auth";

export default function DashboardClientLayout({
    user,
    children,
}: {
    user: User | null;
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Agents', href: '/agents', icon: Users },
        { name: 'Calls', href: '/calls', icon: PhoneForwarded },
        { name: 'Phone Number', href: '/phone-number', icon: Voicemail },
        { name: 'Contacts', href: '/contacts', icon: BookUser },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Billing', href: '/billing', icon: CreditCard },
    ];

    useEffect(() => {
        if (isSidebarOpen) {
            setSidebarOpen(false);
        }
    }, [pathname]);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar for larger screens */}
            <aside className={`hidden md:flex md:fixed md:inset-y-0 flex-col bg-gray-800 text-white transition-all duration-300 ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}>
                <div className="h-16 flex items-center justify-center font-bold text-xl border-b border-gray-700">
                    <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Castform</span>
                    <span className={`${isCollapsed ? 'block' : 'hidden'}`}>CF</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            title={link.name}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg ${pathname === link.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}>
                            <link.icon size={20} />
                            <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{link.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <button 
                        onClick={() => setCollapsed(!isCollapsed)} 
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white  ${isCollapsed ? 'justify-center' : ''}">
                        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                        <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Collapse</span>
                    </button>
                </div>
                <UserProfile user={user} isCollapsed={isCollapsed} />
            </aside>

            {/* Mobile Sidebar and Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <aside className="w-64 flex flex-col bg-gray-800 text-white">
                        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                            <span className="font-bold text-xl">Castform</span>
                            <button onClick={() => setSidebarOpen(false)} className="text-gray-300 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg ${pathname === link.href ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                                    <link.icon size={20} />
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </nav>
                        <UserProfile user={user} isCollapsed={false} />
                    </aside>
                    <div className="flex-1 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
                </div>
            )}

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Mobile Header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 md:hidden">
                    <Link href="/dashboard" className="font-bold text-xl text-gray-900 dark:text-white">Castform</Link>
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
                <Toaster position="top-right" richColors />
            </div>
        </div>
    );
}
