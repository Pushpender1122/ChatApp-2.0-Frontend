import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user';
import { useSocket } from '../context/socketContext';
import { ChatUserContext } from '../context/chatUser';
import axios from 'axios';
import { LuUpload } from "react-icons/lu";
import Dropzone from 'react-dropzone'
import Modal from '../utility/zoomimage';
import forge from 'node-forge';
import { FaAngleDown } from "react-icons/fa6";
function ChatMessages({ setSendMessage }) {
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
    const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
    const [menuPosition, setMenuPosition] = useState('bottom');
    const [contextMenuCoords, setContextMenuCoords] = useState(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const bubbleRef = useRef(null);
    const aesKey = useRef(null);
    aesKey.current = JSON.parse(localStorage.getItem(chatUser?.id));
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
    }, [messages]);
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
                const messages = response.data.map((msg) => ({
                    fromUserId: msg.fromUserId,
                    message: msg.filetype == null ? decryptMessage(msg.message, aesKey.current.aesKey, aesKey.current.iv) : msg.message,
                    senderAvatar: msg.senderAvatar,
                    filetype: msg.filetype,
                }));
                setMessages(messages);
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
                let message = data.fileType == null ? decryptMessage(data.message, aesKey.current.aesKey, aesKey.current.iv) : data.message;
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        fromUserId: data.fromUserId,
                        message,
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
    useEffect(() => {
        if (selectedMessageIndex !== null && !contextMenuCoords) {
            const buttonRect = buttonRef.current?.getBoundingClientRect() || bubbleRef.current.getBoundingClientRect();
            const menuHeight = menuRef.current?.offsetHeight || 100;
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            setMenuPosition(spaceBelow < menuHeight + 40 ? 'top' : 'bottom');
        }
    }, [selectedMessageIndex, contextMenuCoords]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                !bubbleRef.current.contains(e.target)
            ) {
                setSelectedMessageIndex(null);
                setContextMenuCoords(null); // hide the menu if open from right click
            }
        };

        if (selectedMessageIndex !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedMessageIndex]);

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
            const encMessage = encryptMessage(newMessage, aesKey.current.aesKey, aesKey.current.iv);
            socket.emit('private_message', { toUserId: chatUser.id, message: encMessage, SenderID: user._id });
            setNewMessage('');
            setSendMessage((prev) => !prev);
        }
    };
    function encryptMessage(message, key, iv) {
        var cipher = forge.cipher.createCipher('AES-CBC', key);
        cipher.start({ iv: iv });
        cipher.update(forge.util.createBuffer(message));
        cipher.finish();
        var encrypted = cipher.output;
        return encrypted.toHex();
    }
    function decryptMessage(encrypted, key, iv) {
        // Convert key and IV to binary
        try {

            var decipher = forge.cipher.createDecipher('AES-CBC', key);
            decipher.start({ iv: iv });
            decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encrypted)));
            decipher.finish();
            var decrypted = decipher.output;
            return decrypted.toString();
        } catch (e) {
            console.log(e);
        }
    }
    const handleDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        setUploadStatus("uploading");
        reader.onloadend = () => {
            socket.emit('upload-file', { file: reader.result, name: file.name }, (response) => {
                if (response.error) {
                    console.error(response.error);
                    setUploadStatus("error");
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
    const handleRightClick = (e, msgIndex) => {
        e.preventDefault();
        setSelectedMessageIndex(msgIndex);
        setContextMenuCoords({ x: e.clientX, y: e.clientY });
    };

    const handleCopy = (msgToCopy) => {
        navigator.clipboard.writeText(msgToCopy).then(() => {
            console.log('Message copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy message: ', err);
        });
    }
    return (
        <>
            <div ref={messageContainerRef} className="flex-1 p-5 overflow-y-auto bg-gray-900 hide-scrollbar">
                {messages?.map((msg, index) => (
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
                            className={`p-2 rounded-md shadow-lg max-w-sm ${msg?.fromUserId === user?._id
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

                                <div
                                    ref={bubbleRef}
                                    onContextMenu={(e) => handleRightClick(e, index)}
                                    className="break-words relative min-w-[40px] group"
                                >
                                    {/* Message text */}
                                    <p className="whitespace-pre-wrap pr-8">{msg.message}</p>

                                    {/* Icon */}
                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button
                                            ref={buttonRef}
                                            onClick={() => {
                                                setSelectedMessageIndex(selectedMessageIndex === index ? null : index);
                                                setContextMenuCoords(null); // reset custom position if using icon
                                            }}
                                            className="text-gray-500 hover:text-gray-800 p-1"
                                        >
                                            <FaAngleDown size={16} />
                                        </button>
                                    </div>

                                    {/* Action Menu */}
                                    {selectedMessageIndex === index && (
                                        <div
                                            ref={menuRef}
                                            className="absolute shadow rounded py-1 z-30 bg-gray-800 text-white transition-all"
                                            style={
                                                contextMenuCoords
                                                    ? {
                                                        position: 'fixed',
                                                        left: contextMenuCoords.x,
                                                        top: contextMenuCoords.y,
                                                    }
                                                    : {
                                                        right: msg.fromUserId === user?._id ? '0' : 'auto',
                                                        left: msg.fromUserId === user?._id ? 'auto' : '0',
                                                        bottom: menuPosition === 'top' ? '100%' : 'auto',
                                                        top: menuPosition === 'bottom' ? '100%' : 'auto',
                                                        marginTop: menuPosition === 'bottom' ? '6px' : '0',
                                                        marginBottom: menuPosition === 'top' ? '6px' : '0',
                                                    }
                                            }
                                        >
                                            <div className="flex flex-col">
                                                <button className="px-3 py-1 text-left hover:bg-gray-700" onClick={() => { handleCopy(msg.message); setSelectedMessageIndex(null); setContextMenuCoords(null); }}>Copy</button>
                                                {/* <button className="px-3 py-1 text-left hover:bg-gray-700">Edit</button> */}
                                                {/* <button className="px-3 py-1 text-left hover:bg-gray-700">Delete</button> */}
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                ))}
            </div>


            <div className="p-2 flex items-center ml-1 mr-1  rounded-2xl shadow-lg ">
                <div className="flex-1 relative">
                    <textarea
                        value={newMessage}
                        onChange={(e) => handleTyping(e)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message"
                        className="w-full bg-gray-700 text-white p-3 pl-4 pr-4 rounded-full outline-none resize-none overflow-y-auto scrollbar-hide min-h-[45px] max-h-[120px] h-14"

                        disabled={!chatUser}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    />
                    <style >{`
                        textarea::-webkit-scrollbar {
                          display: none;
                          }
                   `}</style>
                </div>
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
                                <div className={`${chatUser ? 'cursor-styleer' : 'cursor-default'} m-4`}>
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