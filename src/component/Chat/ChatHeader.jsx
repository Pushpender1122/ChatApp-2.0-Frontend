import React, { useEffect, useRef, useState } from 'react';
import { ChatUserContext } from '../context/chatUser';
import { IoMenu } from "react-icons/io5";
import { useContext } from 'react';
import { IoMdSettings } from "react-icons/io";
import { IoMdCall } from "react-icons/io";
import { FaVideo } from "react-icons/fa";
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';
import SettingPopup from '../setting/pop.setting';
import Modal from '../utility/zoomimage';
function ChatHeader({ setIsMenuOpen }) {
    const { chatUser, setChatUser } = useContext(ChatUserContext);
    const socket = useSocket();
    const [hoveredIcon, setHoveredIcon] = useState(null);
    const { user, setUser } = useContext(UserContext);
    const [showSettingPopup, setShowSettingPopup] = useState(false);
    const [showImageZoomModal, setImageZoomShowModal] = useState(false);
    const [status, setStatus] = useState('offline');
    const [typingStatus, setTypingStatus] = useState(null);
    const typingTimeoutRef = useRef(null);

    const handleMouseEnter = (iconName) => {
        setHoveredIcon(iconName);
    };

    const handleMouseLeave = () => {
        setHoveredIcon(null);
    };
    useEffect(() => {
        if (socket) {
            socket.on('isTyping', ({ status }) => {
                setTypingStatus(status);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setTypingStatus(null);
                }, 2000);
            });
        }
        return () => {
            socket.off('isTyping');
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [socket]);
    useEffect(() => {
        if (socket && chatUser) {
            socket.emit('isActive', { ReceiverId: chatUser.id });
            socket.on('isActive', (data) => {
                // console.log("isActive", data)
                if (data.status) {
                    setStatus('online');
                }
                else if (data.userId) {
                    if (data.userId === chatUser.id) {
                        setStatus('online');
                    }
                }
                else if (data.disconnectedUserId) {
                    if (data.disconnectedUserId === chatUser.id) {
                        setStatus('offline');
                    }
                }
                else {
                    setStatus('offline');
                }
            })
        }
    }, [socket, chatUser]);

    const handleSetData = (value) => {
        sessionStorage.setItem('chatUser', JSON.stringify(chatUser));
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('value', value);
        window.open(`${process.env.REACT_APP_BASE_URL}/call`, '_blank');
        console.log(socket.id)
    }
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 backdrop-blur border-b border-white/5">
            <div className='block md:hidden cursor-pointer text-white mr-3' onClick={() => {
                setIsMenuOpen(true);
            }}>
                <IoMenu size={20} />
            </div>
            <div className="flex items-center" style={{ 'fontSize': '13px' }}>
                <img
                    src={chatUser?.profileimg || "https://cdn-icons-png.flaticon.com/512/149/149071.png "}
                    onClick={() => {
                        setImageZoomShowModal(true);
                    }}
                    alt="User"
                    className="rounded-full w-11 h-11 object-cover ring-2 ring-blue-500/60 cursor-pointer"
                />
                {showImageZoomModal && (
                    <Modal image={chatUser?.profileimg} alt={'user'} onClose={() => setImageZoomShowModal(false)} />)}
                <div className="ml-3">
                    <span className="block font-semibold text-white">{chatUser?.username}</span>
                    <span className="block text-sm text-gray-400 capitalize" style={{ 'fontSize': '13px' }}>{typingStatus || status}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-white">

                <button
                    className="p-2.5 bg-gray-700 hover:bg-blue-500 transition-colors rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('settings')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => chatUser ? setShowSettingPopup(true) : setShowSettingPopup(false)}

                >
                    <IoMdSettings size={16} />
                </button>
                {showSettingPopup && (<SettingPopup currentUser={user} user={chatUser} onClose={() => setShowSettingPopup(false)} setChatUser={setChatUser} socket={socket} setUser={setUser} setImageZoomShowModal={setImageZoomShowModal} />)}
                <button
                    className="p-2.5 bg-gray-700 hover:bg-blue-500 transition-colors rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('call')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => chatUser ? handleSetData('voice') : ""}
                >
                    <IoMdCall size={16} />
                </button>
                {/* {showVoiceCall && (<VoiceCall user={user} chatUser={chatUser} onClose={() => setShowVoiceCall(false)} value={'voice'} />)} */}
                {/* {showVoiceCall && (<VoiceCall user={user} chatUser={chatUser} onClose={() => setShowVoiceCall(false)} value={'voice'} />)} */}
                <button
                    className="p-2.5 bg-gray-700 hover:bg-blue-500 transition-colors rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('video')}
                    onMouseLeave={handleMouseLeave}
                    // onClick={() => chatUser ? setShowVideoCall(true) : setShowVideoCall(false)}
                    onClick={() => chatUser ? handleSetData('video') : ""}
                >

                    <FaVideo size={16} />
                </button>
                {/* {showVideoCall && (<VoiceCall user={user} chatUser={chatUser} onClose={() => setShowVideoCall(false)} value={'video'} />)} */}

            </div>
        </div >
    );
}

export default ChatHeader;
