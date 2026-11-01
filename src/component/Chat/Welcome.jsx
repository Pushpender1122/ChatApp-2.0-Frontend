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
                className="md:hidden self-start m-4 p-2.5 rounded-xl bg-surface border border-line text-ink"
                onClick={() => setIsMenuOpen(true)}
            >
                <IoMenu size={20} />
            </button>
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
                <span className="w-20 h-20 rounded-3xl bg-brand text-on-brand flex items-center justify-center mb-6">
                    <IoChatbubbleEllipses size={38} />
                </span>
                <h1 className="text-3xl font-bold text-ink mb-3">Welcome to RealTalk</h1>
                <p className="text-muted max-w-md mb-8">
                    Pick a conversation from the list, or add a friend to start chatting.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {features.map(({ icon: Icon, text }) => (
                        <span key={text} className="flex items-center gap-2 text-sm text-ink bg-surface border border-line rounded-full px-4 py-2">
                            <Icon className="text-brand" /> {text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WelcomeMessage;
