import React, { createContext, useContext, useEffect, useState } from 'react';
import socketIO from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = socketIO(process.env.REACT_APP_SOCEKT_URL);

        setSocket(newSocket);
        newSocket.on('connect', () => {
            console.log('connected', newSocket.id);
        });

        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {socket ? children : null} {/* Render children only when socket is ready */}
        </SocketContext.Provider>
    );
};
