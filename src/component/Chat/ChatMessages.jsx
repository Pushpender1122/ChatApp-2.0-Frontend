import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user';
import { useSocket } from '../context/socketContext';
import { ChatUserContext } from '../context/chatUser';
import axios from 'axios';

function ChatMessages() {
    const { user } = useContext(UserContext);
    const { chatUser } = useContext(ChatUserContext);
    const [messages, setMessages] = useState([]);
    // const [messageQueue, setMessageQueue] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socket = useSocket();
    const messageContainerRef = useRef(null);  // Step 1: Create a ref

    // Automatically scroll to the bottom when messages change
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/getMessage`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    params: {
                        SenderId: user?._id,
                        ReceiverId: chatUser?.id,
                    }, // Data sent as query parameters
                });
                console.log(response.data);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        if (user && chatUser) {
            fetchMessages();
            socket.emit('selectedUser', { SenderId: user?._id, ReceiverId: chatUser?.id, });
        }
    }, [user, chatUser]);

    useEffect(() => {
        if (socket && user) {
            socket.on('connect', () => {
                console.log('connected', socket.id);
            });

            socket.on('private_message', (data) => {
                console.log('private_messageComing', data);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        fromUserId: data.fromUserId,
                        message: data.message,
                        senderAvatar: data.senderAvatar,
                    },
                ]);

            });

            // Clean up on component unmount
            return () => {
                socket.off('private_message');
            };
        }
    }, [socket, user]);

    const handleSend = () => {
        if (newMessage.trim()) {
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    fromUserId: user._id,
                    message: newMessage,
                    senderAvatar: user?.profileimg,
                },
            ]);

            socket.emit('private_message', { toUserId: chatUser.id, message: newMessage, SenderID: user._id });
            setNewMessage('');
        }
    };

    return (
        <>
            <div ref={messageContainerRef} className="flex-1 p-5 overflow-y-auto bg-gray-900 hide-scrollbar"> {/* Step 1: Attach ref */}
                {messages?.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-end mb-4 ${msg.fromUserId === user?._id ? 'justify-end' : ''}`}
                    >
                        {msg?.fromUserId !== user?._id && (
                            <img
                                src={chatUser?.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                                alt="Sender"
                                className="rounded-full w-10 h-10 mr-3"
                            />
                        )}
                        <div
                            className={`bg-gray-700 text-white p-4 rounded-lg max-w-xs ${msg?.fromUserId === user?._id ? 'bg-pink-500' : ''
                                }`}
                        >
                            <p>{msg.message}</p>
                        </div>
                        {msg?.fromUserId === user?._id && (
                            <img
                                src={user?.profileimg || "default-avatar-url"}
                                alt="User"
                                className="rounded-full w-10 h-10 ml-3"
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-800 flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent default form submission
                            handleSend();
                        }
                    }}
                    placeholder="Type a message"
                    className="flex-1 bg-gray-700 text-white p-3 rounded-full outline-none mr-3"
                />
                <button onClick={handleSend} className="bg-pink-500 p-3 rounded-full">
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
        </>
    );
}

export default ChatMessages;
