import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
// import MessageInput from './MessageInput';

function ChatWindow() {
    return (
        <div className="flex flex-col flex-1 bg-gray-900">
            <ChatHeader />
            <ChatMessages />
        </div>
    );
}

export default ChatWindow;
