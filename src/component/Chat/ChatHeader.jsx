import React, { useEffect, useState } from 'react';
import { ChatUserContext } from '../context/chatUser';
import { useContext } from 'react';
import { IoMdSettings } from "react-icons/io";
import { IoMdCall } from "react-icons/io";
import { FaVideo } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';
import axios from 'axios';
import SettingPopup from '../setting/pop.setting';
import Modal from '../utility/zoomimage';
import VoiceCall from '../call/voiceCall';
function ChatHeader() {
    const { chatUser, setChatUser } = useContext(ChatUserContext);
    const socket = useSocket();
    const [hoveredIcon, setHoveredIcon] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const { user, setUser } = useContext(UserContext);
    const [showSettingPopup, setShowSettingPopup] = useState(false);
    const [showImageZoomModal, setImageZoomShowModal] = useState(false);
    const [showVoiceCall, setShowVoiceCall] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const togglePopup = () => {
        setShowPopup(!showPopup);
    };

    const handleAccept = async (id) => {
        // Handle accept friend request
        console.log(`Accepted request from user with id: ${id}`);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/accecptfriendrequest`, {
                friendId: id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            console.log(response.data);
            if (response.status === 200) {
                setFriendRequests((prevRequests) =>
                    prevRequests.filter((request) => request._id !== id)
                );
                setNotificationCount((prevCount) => prevCount - 1);
                socket.emit('friendAccecptAck', { ReceiverId: id });
                setUser(null);
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleReject = async (id) => {
        // Handle reject friend request
        console.log(`Rejected request from user with id: ${id}`);
        try {
            const responce = await axios.post(`${process.env.REACT_APP_API_URL}/rejectfriendrequest`, {
                friendId: id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            // console.log(responce);
            if (responce.status === 200) {
                setFriendRequests((prevRequests) =>
                    prevRequests.filter((request) => request._id !== id)
                );
                setNotificationCount((prevCount) => prevCount - 1);
            }
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    };
    const handleMouseEnter = (iconName) => {
        setHoveredIcon(iconName);
    };

    const handleMouseLeave = () => {
        setHoveredIcon(null);
    };
    useEffect(() => {
        if (socket) {
            socket.on('friendNotification', ({ count }) => {
                setNotificationCount(count);
            });
        }
    }, [socket]);
    useEffect(() => {
        socket.on('FriendAcceptAck', () => {
            setUser(null);
        })
    }, [])
    useEffect(() => {
        const fetchFriendDetails = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/friendDetails`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                console.log(response.data);
                setFriendRequests(response.data);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        };
        if (user) {
            fetchFriendDetails();
        }
    }, [user, notificationCount]);
    return (
        <div className="flex items-center justify-between p-5 bg-gray-800">
            <div className="flex items-center">
                <img
                    src={chatUser?.profileimg || "https://plus.unsplash.com/premium_photo-1693007962731-c19c13af42c7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxN3x8fGVufDB8fHx8fA%3D%3D"}
                    onClick={() => {
                        setImageZoomShowModal(true);
                    }}
                    alt="User"
                    className="rounded-full w-12 h-12 cursor-pointer"
                />
                {showImageZoomModal && (
                    <Modal image={chatUser?.profileimg} alt={'user'} onClose={() => setImageZoomShowModal(false)} />)}
                <div className="ml-3">
                    <span className="block font-semibold text-white">{chatUser?.username}</span>
                    <span className="block text-sm text-gray-400">Active Now</span>
                </div>
            </div>
            <div className="flex items-center space-x-4 text-white">
                <div className="relative inline-block">
                    <button
                        className="p-2 bg-gray-700 rounded-full text-white"
                        onMouseEnter={() => handleMouseEnter('notifications')}
                        onMouseLeave={handleMouseLeave}
                        onClick={togglePopup}
                    >
                        <IoIosNotifications size={hoveredIcon === 'notifications' ? 24 : 20} />
                    </button>
                    {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
                            {notificationCount}
                        </span>
                    )}
                </div>


                {/* Popup for Friend Requests */}
                {showPopup && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Friend Requests</h2>
                                <button
                                    onClick={togglePopup}
                                    className="text-gray-500 hover:text-gray-800 text-lg"
                                >
                                    &times;
                                </button>
                            </div>
                            {friendRequests.length > 0 ? (
                                <ul>
                                    {friendRequests.map((request) => (
                                        <li
                                            key={request.id}
                                            className="flex items-center mb-4"
                                        >
                                            <img
                                                src={request.profileimg}
                                                alt={request.username}
                                                className="w-12 h-12 rounded-full mr-4"
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800">{request.username}</h3>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAccept(request._id)}
                                                    className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request._id)}
                                                    className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">No friend requests</p>
                            )}
                        </div>
                    </div>
                )}
                <button
                    className="p-2 bg-gray-700 rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('settings')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => chatUser ? setShowSettingPopup(true) : setShowSettingPopup(false)}

                >
                    <IoMdSettings size={hoveredIcon === 'settings' ? 24 : 20} />
                </button>
                {showSettingPopup && (<SettingPopup currentUser={user} user={chatUser} onClose={() => setShowSettingPopup(false)} setChatUser={setChatUser} socket={socket} setUser={setUser} setImageZoomShowModal={setImageZoomShowModal} />)}
                <button
                    className="p-2 bg-gray-700 rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('call')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => chatUser ? setShowVoiceCall(true) : setShowVoiceCall(false)}
                >
                    <IoMdCall size={hoveredIcon === 'call' ? 24 : 20} />
                </button>
                {showVoiceCall && (<VoiceCall user={user} chatUser={chatUser} onClose={() => setShowVoiceCall(false)} value={'voice'} />)}
                <button
                    className="p-2 bg-gray-700 rounded-full text-white"
                    onMouseEnter={() => handleMouseEnter('video')}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => chatUser ? setShowVideoCall(true) : setShowVideoCall(false)}
                >
                    <FaVideo size={hoveredIcon === 'video' ? 24 : 20} />
                </button>
                {showVideoCall && (<VoiceCall user={user} chatUser={chatUser} onClose={() => setShowVideoCall(false)} value={'video'} />)}

            </div>
        </div >
    );
}

export default ChatHeader;
