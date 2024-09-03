import React, { useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';

function Test() {
    const socket = useSocket();
    const { user } = useContext(UserContext);
    useEffect(() => {
        if (user && socket) {
            socket.emit('register', { userId: user._id });
            socket.emit('friendRequest', { ReceiverId: user._id });
        }

        // if (socket) {
        //     socket.on('private_message', (data) => {
        //         console.log('private_message', data);
        //     });
        // }

        // Cleanup
        return () => {
            if (socket) {
                socket.off('private_message');
            }
        };
    }, [user, socket]);

    return (
        <div className="flex h-screen bg-gray-900">
            <Sidebar />
            <ChatWindow />
        </div>
    );
}

export default Test;
