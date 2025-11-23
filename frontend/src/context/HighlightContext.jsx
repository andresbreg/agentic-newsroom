import React, { createContext, useContext, useState } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
    const [highlights, setHighlights] = useState({
        dashboard: new Set(),
        trash: new Set()
    });

    const addHighlight = (page, ids) => {
        setHighlights(prev => {
            const newSet = new Set(prev[page]);
            ids.forEach(id => newSet.add(id));
            return { ...prev, [page]: newSet };
        });

        // Optional: Auto-clear after some time? 
        // For now, we keep them until page refresh or manual clear logic if needed.
        // User said "Just for new arrivals in the session", so keeping them is fine.
    };

    const clearHighlights = (page) => {
        setHighlights(prev => ({ ...prev, [page]: new Set() }));
    };

    return (
        <HighlightContext.Provider value={{ highlights, addHighlight, clearHighlights }}>
            {children}
        </HighlightContext.Provider>
    );
};

export const useHighlight = () => useContext(HighlightContext);
