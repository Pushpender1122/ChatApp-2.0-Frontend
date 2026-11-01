import React, { useEffect, useRef, useState } from 'react';
import { ChatUserContext } from '../context/chatUser';
import { IoArrowBack } from "react-icons/io5";
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
    const { user, setUser } = useContext(UserContext);
    const [showSettingPopup, setShowSettingPopup] = useState(false);
    const [showImageZoomModal, setImageZoomShowModal] = useState(false);
    const [status, setStatus] = useState('offline');
    const [typingStatus, setTypingStatus] = useState(null);
    const typingTimeoutRef = useRef(null);

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
    const circleBtn = "w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-brand hover:bg-brand-soft transition-colors";
    return (
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-surface border-b border-line">
            <div className="flex items-center min-w-0">
                <button
                    aria-label="Back to chats"
                    className="md:hidden mr-2 w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-raised"
                    onClick={() => setIsMenuOpen(true)}
                >
                    <IoArrowBack size={20} />
                </button>
                <img
                    src={chatUser?.profileimg || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    onClick={() => setImageZoomShowModal(true)}
                    alt="User"
                    className="rounded-full w-11 h-11 object-cover cursor-pointer shrink-0"
                />
                {showImageZoomModal && (
                    <Modal image={chatUser?.profileimg} alt={'user'} onClose={() => setImageZoomShowModal(false)} />)}
                <div className="ml-3 min-w-0">
                    <span className="block font-semibold text-ink truncate">{chatUser?.username}</span>
                    <span className={`block text-xs capitalize ${typingStatus || status === 'online' ? 'text-brand' : 'text-muted'}`}>{typingStatus || status}</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button className={circleBtn} aria-label="Voice call" title="Voice call" onClick={() => chatUser ? handleSetData('voice') : ""}>
                    <IoMdCall size={20} />
                </button>
                <button className={circleBtn} aria-label="Video call" title="Video call" onClick={() => chatUser ? handleSetData('video') : ""}>
                    <FaVideo size={18} />
                </button>
                <button className={circleBtn} aria-label="Contact info" title="Contact info" onClick={() => chatUser && setShowSettingPopup(true)}>
                    <IoMdSettings size={20} />
                </button>
                {showSettingPopup && (<SettingPopup currentUser={user} user={chatUser} onClose={() => setShowSettingPopup(false)} setChatUser={setChatUser} socket={socket} setUser={setUser} setImageZoomShowModal={setImageZoomShowModal} />)}
            </div>
        </header>
    );
}

export default ChatHeader;
