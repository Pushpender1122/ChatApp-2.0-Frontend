import axios from "axios";
import { useEffect, useRef, useState } from "react";
import React from 'react';
import { UserContext } from "../context/user";
import { useContext } from "react";
import { ChatUserContext } from '../context/chatUser';
import { useSocket } from '../context/socketContext';
import { IoIosNotifications, IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import forge from 'node-forge';

function Sidebar({ setIsMenuOpen, sendMessage }) {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, setUser } = useContext(UserContext);
    const { setChatUser, chatUser } = useContext(ChatUserContext);
    const [showPopup, setShowPopup] = useState(false);
    const [searchUserPublic, setSearchUserPublic] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [friends, setFriends] = useState([])
    const socket = useSocket();
    const [messageNotification, setMessageNotification] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [friendRequests, setFriendRequests] = useState([]);
    const [showPopupFriendRequest, setShowPopupFriendRequest] = useState(false);
    const [filterPublicList, setFilterPublicList] = useState([]);
    const friendsRef = useRef(friends);
    const [allUserStatus, setAllUserStatus] = useState([]);
    const [alertmsg, setAlertmsg] = useState({
        message: '',
        type: 'success',
    });
    const [animatedUserId, setAnimatedUserId] = useState(null);

    const notify = () => toast[alertmsg.type](alertmsg.message, {
        autoClose: 2000,
    });

    const togglePopupForFriends = () => {
        setShowPopupFriendRequest(!showPopupFriendRequest);
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
            // console.log(response.data);
            if (response.status === 200) {
                setFriendRequests((prevRequests) =>
                    prevRequests.filter((request) => request._id !== id)
                );
                await getTheKey(id);
                setNotificationCount((prevCount) => prevCount - 1);
                socket.emit('friendAccecptAck', { ReceiverId: id });
                setUser(null);
                setShowPopupFriendRequest(false);
                getUser();
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const getTheKey = async (id) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/key`,
                {
                    friendId: id,
                    publicKey: localStorage.getItem('publicKey'),
                }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.status === 200) {
                const decryptedAesKey = forge.pki.privateKeyFromPem(localStorage.getItem('privateKey')).decrypt(forge.util.decode64(response.data.aesKey), 'RSA-OAEP');
                const decryptedIv = forge.pki.privateKeyFromPem(localStorage.getItem('privateKey')).decrypt(forge.util.decode64(response.data.iv), 'RSA-OAEP');
                const obj = {
                    aesKey: decryptedAesKey,
                    iv: decryptedIv,
                };
                localStorage.setItem(id, JSON.stringify(obj));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

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
                setShowPopupFriendRequest(false);
            }
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    };

    const getUser = async () => {
        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getAllUser`);
            setFilterPublicList(response.data.filter((u) => {
                return u._id !== user?._id && !user?.friends?.includes(u._id)
            }))
            setUsers(response.data.filter((use) => use._id !== user?._id))

            // console.log("This is getAlluser", response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        // Fetch users when the component mounts
        getUser();
        socket.emit('allUserStatus')
    }, []);

    useEffect(() => {
        if (user && users) {
            // Filter friends in a single pass instead of using forEach and multiple state updates
            const friendsList = users.filter(u => user.friends?.includes(u._id));

            // Set all states after processing is complete
            setFriends([]);
            setMessageNotification(user.messageStatus);

            // Only call sortByLastMessage if we have friends to sort
            if (friendsList.length > 0) {
                sortByLastMessage(friendsList);
            }


        }
    }, [user, users]);

    const sortByLastMessage = (friendsList) => { // this is for sorting the friends list when data is coming from server
        if (friendsList.length === 0) return;
        const sortedFriends = friendsList.sort((a, b) => {
            // Find message status for each friend
            const aStatus = user?.messageStatus?.find(status => status.userId === a._id);
            const bStatus = user?.messageStatus?.find(status => status.userId === b._id);
            if (!aStatus && !bStatus) return 0;
            if (!aStatus) return 1;
            if (!bStatus) return -1;
            // Get updatedAt timestamps or use current date as fallback
            const aTime = aStatus?.updatedAt ? new Date(aStatus.updatedAt) : new Date(0);
            const bTime = bStatus?.updatedAt ? new Date(bStatus.updatedAt) : new Date(0);

            // Sort in descending order (newest first)
            return bTime - aTime;
        });
        // console.log("This is sortedFriends", sortedFriends);
        setFriends(sortedFriends);
    }

    const clientSideSort = (userForFilterID) => {
        // Don't do anything if the user is already at the top
        const currentIndex = friendsRef.current.findIndex(f => f._id === userForFilterID);
        console.log("currentIndex", currentIndex);
        if (currentIndex === 0) return;

        // Find the user to move to top
        const userToMove = friendsRef.current.find(f => f._id === userForFilterID);
        console.log("userToMove", userToMove);
        if (!userToMove) return;

        // Mark this user for animation
        setAnimatedUserId(userForFilterID);

        // Create a new array with the user moved to the top without removing first
        // This allows the animation to start from current position
        const updatedFriends = [
            userToMove,
            ...friendsRef.current.filter(f => f._id !== userForFilterID)
        ];

        setFriends(updatedFriends);

        // Reset animation flag after animation completes
        setTimeout(() => {
            setAnimatedUserId(null);
        }, 400);
    };

    // Filter users based on search term
    const filteredUsers = friends.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filterPubUser = filterPublicList.filter(user =>
        user.username.toLowerCase().includes(searchUserPublic.toLowerCase())
    );

    const handleChangeUser = async (id, username, profileimg, email, description) => {
        setIsMenuOpen(false);
        if (!localStorage.getItem(id)) {
            await getTheKey(id);
        }
        setChatUser({ id, username, profileimg, email, description });
        socket.emit('messageStatus', { SenderID: user._id, ReceiverId: id });
        setMessageNotification(messageNotification.filter(m => m.userId !== id));
    }

    const togglePopup = async () => {
        await getUser();
        setShowPopup(!showPopup);
        setSelectedUser(null);
    };

    const handleAddFriend = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/addFriend`, {
                friendId: selectedUser._id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.data.message === 'Friend added successfully') {
                setAlertmsg({
                    message: response.data.message,
                    type: 'success',
                });
                socket.emit('friendRequest', { ReceiverId: selectedUser._id });
            }
            setShowPopup(!showPopup);
            setSelectedUser(null);
        } catch (error) {
            setAlertmsg({
                message: error.response.data.message,
                type: 'error',
            });
            console.error('Error adding friend:', error);
        }
    };

    const handleRemoveFriend = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/removefriend`, {
                friendId: selectedUser._id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.data.message === 'Friend removed successfully') {
                setAlertmsg({
                    message: response.data.message,
                    type: 'success',
                });
                if (selectedUser) {
                    setFriends(prevFriends => prevFriends.filter(f => f._id !== selectedUser._id));
                    socket.emit('friendRemove', { senderId: user._id, ReceiverId: selectedUser._id });
                }
                if (selectedUser?._id === chatUser?.id) {
                    setChatUser(null);
                }
                setShowPopup(!showPopup);
                setSelectedUser(null);
            }
        } catch (error) {
            setAlertmsg({
                message: error.response.data.message,
                type: 'error',
            });
            console.error('Error removing friend:', error);
            setShowPopup(!showPopup);
            setSelectedUser(null);
        }
    };

    useEffect(() => {
        if (alertmsg.message !== '') {
            notify();
        }
    }, [alertmsg]);

    useEffect(() => {
        const fetchFriendDetails = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/friendDetails`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setFriendRequests(response.data);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        };
        if (user) {
            fetchFriendDetails();
        }
    }, [user, notificationCount]);

    useEffect(() => {
        socket.on('messageNotification', (data) => {
            setMessageNotification(prev => {
                const existingNotification = prev.find(m => m.userId === data.SenderID);
                if (existingNotification) {
                    return prev.map(m => m.userId === data.SenderID ? { ...m, status: true, messageCount: m.messageCount + 1 } : m);
                } else {
                    return [...prev, { userId: data.SenderID, status: true, messageCount: 1 }];
                }
            });
            clientSideSort(data.SenderID);
        });
        socket.on('friendNotification', ({ count }) => {
            setNotificationCount(count);
        });
    }, [socket]);

    useEffect(() => {
        socket.on('FriendAcceptAck', () => {
            setUser(null);
        })
        socket.on('FriendRemove', (data) => {
            setFriends(prevFriends => prevFriends.filter(f => f._id !== data.senderId));
            setChatUser(null);
            setUser(null);
            localStorage.removeItem(data.senderId);
        })
        socket.on('allUserStatus', ((data) => {
            // console.log("this is data state", data)
            if (data?.currentUsers) {
                // console.log("This is Cur", data.currentUsers);
                setAllUserStatus(data.currentUsers);
            }
            if (data?.disconnectedUserId) {
                // console.log("This is disconnectedUserId", data.disconnectedUserId);
                setAllUserStatus(prev => prev.filter(userId => userId !== data?.disconnectedUserId));
            }
            if (data?.userId) {
                // console.log("This is userid", data.userId);
                setAllUserStatus(prev => [...prev, data.userId]);
            }
        }))
    }, [])

    useEffect(() => {
        friendsRef.current = friends;
    }, [friends]);

    // When sendMessage changes and we have a chatUser, move that user to the top
    useEffect(() => {
        if (chatUser) {
            clientSideSort(chatUser.id);
        }
    }, [sendMessage]);

    return (
        <>
            <div className="w-10/12 md:w-72 bg-gray-800 text-white flex flex-col p-4 h-screen transition-all duration-300 ease-in-out">
                {/* Profile Section */}
                <div className="flex items-center mb-5 animate-fadeIn">
                    <img
                        src={user?.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                        alt="Profile"
                        className="rounded-full w-12 h-12 mr-3 hover:scale-110 transition-transform duration-200"
                    />
                    <div className="flex-1">
                        <h2 className="font-semibold text-lg">{user?.username}</h2>
                        <span className="text-sm text-gray-400">Active Now</span>
                    </div>
                    <Link to={`${process.env.REACT_APP_BASE_URL}/profile`}>
                        <IoMdSettings style={{ 'marginRight': '1em' }} className="cursor-pointer hover:rotate-90 transition-transform duration-300" />
                    </Link>
                    <button onClick={togglePopup} className="bg-pink-500 text-white text-lg p-2 rounded-full hover:bg-pink-600 transform hover:scale-110 transition-all duration-200" style={{
                        height: '1.7rem',
                        width: '1.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>+</button>
                    <div className="relative inline-block">
                        <button
                            className="p-2 bg-gray-700 rounded-full text-white ml-2 hover:bg-gray-600 transition-colors duration-200"
                            onClick={togglePopupForFriends}
                        >
                            <IoIosNotifications className={notificationCount > 0 ? "animate-pulse" : ""} />
                        </button>

                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                                {notificationCount}
                            </span>
                        )}
                    </div>
                    {/* Popup for Friend Requests */}
                    {showPopupFriendRequest && (
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" >
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-scaleIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Friend Requests</h2>
                                    <button
                                        onClick={togglePopupForFriends}
                                        className="text-gray-500 hover:text-gray-800 text-lg transition-colors duration-200"
                                    >
                                        &times;
                                    </button>
                                </div>
                                {friendRequests.length > 0 ? (
                                    <ul>
                                        {friendRequests.map((request, index) => (
                                            <li
                                                key={request.id}
                                                className="flex items-center mb-4 animate-slideInRight"
                                                style={{ animationDelay: `${index * 0.1}s` }}
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
                                                        className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 transition-colors duration-200"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request._id)}
                                                        className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
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
                </div>

                {/* Popup */}
                {showPopup && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center animate-fadeIn z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative animate-scaleIn">
                            <div className="flex justify-between items-center mb-4">
                                {!selectedUser ? (
                                    <h2 className="text-2xl font-bold` text-gray-800">Select User</h2>
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                                )}
                                <button
                                    onClick={togglePopup}
                                    className="text-gray-500 hover:text-gray-800 text-lg transition-colors duration-200"
                                >
                                    &times;
                                </button>
                            </div>

                            {!selectedUser ? (
                                <>
                                    {/* Search Bar */}
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchUserPublic}
                                        onChange={(e) => setSearchUserPublic(e.target.value)}
                                        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-black"
                                    />

                                    {/* User List */}
                                    <ul className="max-h-60 overflow-y-auto">
                                        {filterPubUser.map((user, index) => (
                                            <li
                                                key={user._id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center transition-colors duration-200 animate-slideInLeft"
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <img
                                                    src={user.profileimg}
                                                    alt={user.username}
                                                    className="rounded-full w-10 h-10 mr-3"
                                                />
                                                <span className="text-black">{user.username}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div className="animate-fadeIn">
                                    {/* User Profile */}
                                    <div className="flex items-center mb-4">
                                        <img
                                            src={selectedUser.profileimg}
                                            alt={selectedUser.username}
                                            className="rounded-full w-16 h-16 mr-4 animate-pulse"
                                        />
                                        <div>
                                            <h3 className="text-xl font-semibold text-black">{selectedUser.username}</h3>
                                        </div>
                                    </div>

                                    {/* Add/Remove Friend Buttons */}
                                    <div className="flex justify-between">
                                        <button
                                            onClick={handleAddFriend}
                                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200"
                                        >
                                            Add Friend
                                        </button>
                                        <button
                                            onClick={handleRemoveFriend}
                                            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transform hover:scale-105 transition-all duration-200"
                                        >
                                            Remove Friend
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 text-white p-2 rounded-lg outline-none"
                    />
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <h3 className="text-sm text-gray-400 mb-2 hide-scrollbar">Friends</h3>
                    <div className="space-y-3 hide-scrollbar">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => {
                                // Check if this user is being animated (moving to top)
                                const isBeingAnimated = u._id === animatedUserId;
                                // Check if this is the active chat user
                                const isActiveChatUser = chatUser?.id === u._id;

                                return (
                                    <div
                                        key={u._id}
                                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-300
                                            ${isActiveChatUser
                                                ? 'bg-gradient-to-r from-indigo-600 to-grey-600 shadow-md'
                                                : 'bg-gray-700 hover:bg-gray-600'}
                                            ${isBeingAnimated ? 'animate-whatsapp-style-move' : ''}`}
                                        onClick={() => handleChangeUser(u._id, u.username, u.profileimg, u.email, u.description)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={u.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                                                alt={u.username}
                                                className={`rounded-full w-10 h-10 mr-3 ${isBeingAnimated ? 'animate-brief-pulse' : ''}`}
                                            />
                                            {/* {isActiveChatUser && (
                                                <span className="absolute bottom-0 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                                            )} */}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{u.username}</h4>
                                            <p className="text-xs text-gray-400">
                                                {allUserStatus.some((status) => status === u._id) ? "Online" : "Offline"}
                                                {/* {console.log(allUserStatus)} */}
                                            </p>
                                        </div>
                                        {messageNotification.some((m) => m.userId === u._id && m.status === true) && (
                                            <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold animate-notification-pulse">
                                                <span className="text-white">{messageNotification.find((m) => m.userId === u._id)?.messageCount || 1}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-400 animate-pulse">No users found</p>
                        )}
                        <ToastContainer />
                    </div>
                </div>
            </div>
            <div className="z-50 w-auto md:hidden transition-opacity duration-300 hover:opacity-75" style={{ color: 'rgb(17 24 39 / var(--tw-bg-opacity))' }} onClick={() => setIsMenuOpen(false)}>div test te</div>
            <style>{`
            @keyframes whatsapp-style-move {
                    0% { 
                        transform: translateY(0); 
                        opacity: 1;
                        z-index: 10;
                    }
                    25% { 
                        transform: translateY(-5px); 
                        opacity: 0.9;
                        z-index: 10;
                    }
                    50% { 
                        transform: translateY(-40px); 
                        opacity: 0;
                        z-index: 10;
                    }
                    51% { 
                        transform: translateY(0); 
                        opacity: 0;
                        z-index: 10;
                    }
                    100% { 
                        transform: translateY(0); 
                        opacity: 1;
                        z-index: 10;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideInLeft {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes whatsapp-style-move {
                    0% { transform: translateY(40px); opacity: 0; }
                    50% { transform: translateY(10px); opacity: 0.8; }
                    75% { transform: translateY(5px); opacity: 0.9; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes brief-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }
                @keyframes notification-pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out forwards;
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.3s ease-out forwards;
                }
                .animate-whatsapp-style-move {
                    animation: whatsapp-style-move 0.8s ease-in-out forwards;
                }
                .animate-brief-pulse {
                    animation: brief-pulse 0.5s ease-in-out;
                }
                .animate-notification-pulse {
                    animation: notification-pulse 1s infinite;
                }
            `}</style>
        </>
    );
}

export default Sidebar;