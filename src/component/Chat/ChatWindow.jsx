import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
// import MessageInput from './MessageInput';
import { ChatUserContext } from '../context/chatUser';
import { useContext } from 'react';
import WelcomeMessage from './Welcome';
function ChatWindow({ setIsMenuOpen }) {
    const { chatUser } = useContext(ChatUserContext);
    return (
        <div className="flex flex-1 flex-col bg-gray-900" >
            {chatUser && <ChatHeader setIsMenuOpen={setIsMenuOpen} />}
            {chatUser && <ChatMessages />}
            {!chatUser && <WelcomeMessage />}

            {/* <ChatHeader setIsMenuOpen={setIsMenuOpen} /> */}
            {/* <ChatMessages /> */}
        </div>
    );
}

export default ChatWindow;
