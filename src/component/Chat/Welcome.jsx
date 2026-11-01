import React from 'react';
import { IoMenu, IoChatbubbleEllipses, IoLockClosed, IoImages, IoCall } from 'react-icons/io5';

const features = [
    { icon: IoLockClosed, text: 'End-to-end encrypted' },
    { icon: IoImages, text: 'Photos & videos' },
    { icon: IoCall, text: 'Voice & video calls' },
];

function WelcomeMessage({ setIsMenuOpen }) {
    return (
        <div className="chat-bg flex flex-col flex-1 h-full">
            <button
                aria-label="Open chats"
                className="md:hidden self-start m-4 p-2.5 rounded-xl bg-gray-800 text-white"
                onClick={() => setIsMenuOpen(true)}
            >
                <IoMenu size={20} />
            </button>
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
                <span className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-6">
                    <IoChatbubbleEllipses size={38} />
                </span>
                <h1 className="text-3xl font-bold text-white mb-3">Welcome to RealTalk</h1>
                <p className="text-gray-400 max-w-md mb-8">
                    Select a friend from the list to start a conversation, or add someone new with the + button.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {features.map(({ icon: Icon, text }) => (
                        <span key={text} className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                            <Icon className="text-green-400" /> {text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WelcomeMessage;
