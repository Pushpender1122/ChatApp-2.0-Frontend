import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user';
import { useSocket } from '../context/socketContext';
import { ChatUserContext } from '../context/chatUser';
import axios from 'axios';
import { LuUpload } from "react-icons/lu";
import Dropzone from 'react-dropzone'
import Modal from '../utility/zoomimage';
function ChatMessages() {
    const { user } = useContext(UserContext);
    const { chatUser } = useContext(ChatUserContext);
    const [messages, setMessages] = useState([]);
    // const [messageQueue, setMessageQueue] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socket = useSocket();
    const messageContainerRef = useRef(null); // Reference to the message container div for scrolling
    const [showImageZoomModal, setImageZoomShowModal] = useState(false);
    const [zoomImage, zoomSetImage] = useState('');
    const [uploadStatus, setUploadStatus] = useState(null);
    const [skip, setSkip] = useState(40);
    const [isFetching, setIsFetching] = useState(false);
    const [isTypingMessage, setIsTypingMessage] = useState(false);
    const total = useRef(0);
    // Automatically scroll to the bottom when messages change
    useEffect(() => {
        const scrollToBottom = () => {
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTo({
                    top: messageContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        };
        scrollToBottom();
        const timeoutId = setTimeout(scrollToBottom, 500);
        return () => clearTimeout(timeoutId);
    }, [chatUser, isTypingMessage]);
    useEffect(() => {
        total.current = 0;
        setMessages([]);
        setSkip(40);
    }, [chatUser]);
    const handleMessageTop = async () => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/getMessage`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    params: {
                        SenderId: user?._id,
                        ReceiverId: chatUser?.id,
                        skip: skip,
                    }, // Data sent as query parameters
                });
                console.log(response.data.messages);

                setTimeout(() => {
                    setMessages((prevMessages) => [...response.data.messages, ...prevMessages]);
                    setIsFetching(false);
                    setTimeout(() => {
                        messageContainerRef.current.scrollTop += 1550
                    }, 100)
                }, 1000)
                // setMessages((prevMessages) => [...response.data, ...prevMessages]);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        console.log(messageContainerRef.current.scrollTop);
        if (messageContainerRef.current.scrollTop === 0 && !isFetching) {
            console.log('fetching');
            // messageContainerRef.current.scrollTop += 10
            total.current > skip ? setIsFetching(true) : setIsFetching(false);
            setTimeout(() => {
                if (total.current > skip) {
                    fetchMessages();
                    setSkip(skip + 20);
                }
            }, 2000);
        }

    }
    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        socket.emit('isTyping', { ReceiverId: chatUser?.id, SenderId: user?._id });
    };
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
                setMessages(response.data.messages);
                total.current = response.data.total;
                setIsFetching(false);
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
                        filetype: data.fileType,
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
            setIsTypingMessage(!isTypingMessage);
            socket.emit('private_message', { toUserId: chatUser.id, message: newMessage, SenderID: user._id });
            setNewMessage('');
        }
    };
    const handleDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        setUploadStatus("uploading");
        reader.onloadend = () => {

            socket.emit('upload-file', { file: reader.result, name: file.name }, (response) => {
                if (response.error) {
                    console.error(response.error);
                    setUploadStatus("error");
                    setTimeout(() => {
                        setUploadStatus(null);
                    }, 2000);
                } else {
                    const fileexe = file.name.split('.').pop();
                    console.log(fileexe);
                    setUploadStatus("uploaded");
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            fromUserId: user._id,
                            message: response.url,
                            senderAvatar: user?.profileimg,
                            filetype: fileexe,
                        },
                    ]);
                    console.log(response.url);
                    socket.emit('private_message', { toUserId: chatUser.id, message: response.url, SenderID: user._id, fileType: fileexe });
                    setTimeout(() => {
                        setUploadStatus(null);
                    }, 2000);
                }
            });
        };
        reader.readAsDataURL(file); // it will convert file to base64 string and trigger onloadendz
        // const obj = { fromUserId: user._id, file: file, senderAvatar: user?.profileimg, fileType: file.type, fileName: file.name }
        // socket.emit('private_message', { toUserId: chatUser.id, message: obj, SenderID: user._id });
    }
    const handleZoom = (e) => {
        zoomSetImage(e.target.src);
        setImageZoomShowModal(true);
    }
    return (
        <>
            <div ref={messageContainerRef} onScroll={handleMessageTop} className="flex-1 p-5 overflow-y-auto bg-gray-900 hide-scrollbar">

                {!isFetching ? (messages?.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-end mb-6 ${msg.fromUserId === user?._id ? 'justify-end' : ''}`}
                    >
                        {/* Display profile image if message is from another user */}
                        {msg?.fromUserId !== user?._id && (
                            <img
                                src={chatUser?.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                                alt="Sender"
                                className="rounded-full w-10 h-10 mr-3 shadow-lg"
                            />
                        )}

                        <div
                            className={`p-4 rounded-2xl shadow-lg max-w-sm ${msg?.fromUserId === user?._id
                                ? msg.filetype?.toLowerCase() === 'jpg' || msg.filetype?.toLowerCase() === 'jpeg' || msg.filetype?.toLowerCase() === 'png' || msg.filetype?.toLowerCase() === 'mp4'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-pink-500 text-white'
                                : 'bg-gray-700 text-white'
                                }`}
                        >
                            {msg.filetype?.toLowerCase() === 'jpg' || msg.filetype?.toLowerCase() === 'jpeg' || msg.filetype?.toLowerCase() === 'png' ? (
                                <img src={msg.message} alt="file" className="rounded-lg w-full h-auto mb-2 cursor-pointer" onClick={handleZoom} />
                            ) : msg.filetype?.toLowerCase() === 'mp4' ? (
                                <video src={msg.message} controls className="rounded-lg w-full h-auto mb-2" />
                            ) : (
                                <p className="break-words">{msg.message}</p>
                            )}
                            {showImageZoomModal && (
                                <Modal image={zoomImage} alt={'image'} onClose={() => setImageZoomShowModal(false)} />)}
                        </div>

                        {/* Display user profile image if message is from the current user */}
                        {msg?.fromUserId === user?._id && (
                            <img
                                src={user?.profileimg || "default-avatar-url"}
                                alt="User"
                                className="rounded-full w-10 h-10 ml-3 shadow-lg"
                            />
                        )}
                    </div>
                ))) : <div className='text-white flex justify-center items-center'><img className='h-8 w-8' src='/loader.gif' alt='loader'></img></div>}
            </div>


            <div className="p-4  flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent default form submission
                            handleSend();
                        }
                    }}
                    placeholder="Type a message"
                    className="flex-1 bg-gray-700 text-white p-3 rounded-full outline-none "
                    disabled={!chatUser}
                />
                <Dropzone
                    onDrop={acceptedFiles => handleDrop(acceptedFiles)}
                    // accept="image/*,video/*"
                    disabled={!chatUser}
                    onError={(e) => console.log(e)}
                >
                    {({ getRootProps, getInputProps }) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} name='file' disabled={!chatUser} type='file' accept="image/*,video/*" />
                                <div className={`${chatUser ? 'cursor-pointer' : 'cursor-default'} m-4`}>
                                    <LuUpload className="text-white" size={18} />
                                </div>
                            </div>
                        </section>
                    )}
                </Dropzone>
                {uploadStatus === "uploading" && (
                    <div className="text-gray-500 flex items-center mt-2">
                        <span className="loader mr-2"></span> Uploading...
                    </div>
                )}
                {uploadStatus === "uploaded" && (
                    <div className="text-green-500 mt-2">File uploaded successfully!</div>
                )}
                {uploadStatus === "error" && (
                    <div className="text-red-500 mt-2">Error uploading file. Please try again.</div>
                )}
                <button onClick={handleSend} className="bg-pink-500 p-3 rounded-full" disabled={!chatUser}>
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
