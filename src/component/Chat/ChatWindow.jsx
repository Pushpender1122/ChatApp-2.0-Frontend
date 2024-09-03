import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
// import MessageInput from './MessageInput';
import { ChatUserContext } from '../context/chatUser';
import { useContext } from 'react';
function ChatWindow() {
    const { chatUser } = useContext(ChatUserContext);
    return (
        <div className="flex flex-col flex-1 bg-gray-900">
            {/* {chatUser && <ChatHeader />} */}
            <ChatHeader />
            <ChatMessages />


        </div>
    );
}

export default ChatWindow;
