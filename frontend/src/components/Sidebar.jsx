import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight, Newspaper, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../context/ThemeContext';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Sidebar = ({ collapsed, setCollapsed }) => {
    const { theme, toggleTheme } = useTheme();
    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const NavItem = ({ to, icon: Icon, label }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 group",
                    isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                )
            }
        >
            <Icon size={20} className="shrink-0" />
            <span
                className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
            >
                {label}
            </span>
            {collapsed && (
                <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {label}
                </div>
            )}
        </NavLink>
    );

    return (
        <aside
            className={cn(
                "h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 relative",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                        <Newspaper size={20} className="text-white" />
                    </div>
                    <span
                        className={cn(
                            "font-bold text-lg text-gray-800 dark:text-white whitespace-nowrap transition-all duration-300",
                            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}
                    >
                        Sala de Prensa
                    </span>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10 text-gray-500 dark:text-gray-400"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 mt-4">
                <NavItem to="/" icon={LayoutDashboard} label="Panel de Control" />
                <NavItem to="/settings" icon={Settings} label="Fuentes" />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <button
                    onClick={toggleTheme}
                    className={cn(
                        "flex items-center gap-3 w-full p-2 rounded-md transition-colors duration-200 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                        collapsed && "justify-center"
                    )}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span
                        className={cn(
                            "whitespace-nowrap overflow-hidden transition-all duration-300",
                            collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                        )}
                    >
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
