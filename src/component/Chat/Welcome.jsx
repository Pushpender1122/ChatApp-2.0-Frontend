import React from 'react';
import { IoMenu } from 'react-icons/io5';

function WelcomeMessage({ setIsMenuOpen }) {
    return (
        <>
            <div className='block md:hidden cursor-pointer text-white p-10' style={{ 'marginRight': '1rem' }} onClick={() => {
                setIsMenuOpen(true);
            }}>
                <IoMenu size={20} />
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-50 p-8">

                <h1 className="text-2xl font-semibold text-white mb-4">
                    Welcome to RealTalk!
                </h1>
                <p className="text-lg mb-2">
                    RealTalk lets you connect with friends and family through instant messaging, video calls, and more.
                </p>
                <p className="text-lg mb-2">
                    You can share photos, videos seamlessly.
                </p>
                <p className="text-lg">
                    Start a conversation now and experience real-time communication.
                </p>
            </div>
        </>
    );
}

export default WelcomeMessage;
