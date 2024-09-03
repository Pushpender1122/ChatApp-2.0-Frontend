import React from 'react';

function MessageInput() {
    return (
        <div className="p-4 bg-gray-800 flex items-center">
            <input
                type="text"
                placeholder="Type a message"
                className="flex-1 bg-gray-700 text-white p-3 rounded-full outline-none mr-3"
            />
            <button className="bg-pink-500 p-3 rounded-full">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M12 5l7 7-7 7"
                    />
                </svg>
            </button>
        </div>
    );
}

export default MessageInput;
