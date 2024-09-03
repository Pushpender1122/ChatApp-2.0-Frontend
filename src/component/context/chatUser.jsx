import { React, useState } from 'react';
import { createContext } from 'react';

export const ChatUserContext = createContext(null);

export const ChatUserProvider = ({ children }) => {
    const [chatUser, setChatUser] = useState(null);

    return (
        <ChatUserContext.Provider value={{ chatUser, setChatUser }}>
            {children}
        </ChatUserContext.Provider>
    );
}
