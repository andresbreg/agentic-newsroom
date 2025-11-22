import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';

const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
                <StatusBar />
            </div>
        </div>
    );
};

export default Layout;
