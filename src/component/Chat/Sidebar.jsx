import axios from "axios";
import { useEffect, useRef, useState } from "react";
import React from 'react';
import { UserContext } from "../context/user";
import { useContext } from "react";
import { ChatUserContext } from '../context/chatUser';
import { useSocket } from '../context/socketContext';
import { IoIosNotifications } from "react-icons/io";
import { IoPersonAdd, IoSearch, IoChatbubbleEllipses } from "react-icons/io5";
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

    const avatarFallback = "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D";
    const iconBtn = "relative w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-raised transition-colors";
    const modalBackdrop = "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn z-50";
    const modalCard = "bg-surface text-ink border border-line rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scaleIn";
    return (
        <>
            <aside className="w-full md:w-80 lg:w-96 bg-surface text-ink flex flex-col h-full border-r border-line">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h1 className="text-2xl font-bold">Chats</h1>
                    <div className="flex items-center gap-1">
                        <button onClick={togglePopup} className={iconBtn} aria-label="Add friend" title="Add friend">
                            <IoPersonAdd size={19} />
                        </button>
                        <button onClick={togglePopupForFriends} className={iconBtn} aria-label="Friend requests" title="Friend requests">
                            <IoIosNotifications size={22} className={notificationCount > 0 ? "animate-pulse" : ""} />
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                                    {notificationCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-raised text-ink placeholder-muted pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-brand/40"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3">
                    {filteredUsers.length > 0 ? (
                        <div className="space-y-1">
                            {filteredUsers.map((u) => {
                                const isBeingAnimated = u._id === animatedUserId;
                                const isActiveChatUser = chatUser?.id === u._id;
                                const isOnline = allUserStatus.some((status) => status === u._id);
                                const unread = messageNotification.find((m) => m.userId === u._id && m.status === true);
                                return (
                                    <div
                                        key={u._id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors duration-200
                                            ${isActiveChatUser ? 'bg-brand-soft' : 'hover:bg-raised'}
                                            ${isBeingAnimated ? 'animate-whatsapp-style-move' : ''}`}
                                        onClick={() => handleChangeUser(u._id, u.username, u.profileimg, u.email, u.description)}
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={u.profileimg || avatarFallback}
                                                alt={u.username}
                                                className={`rounded-full w-12 h-12 object-cover ${isBeingAnimated ? 'animate-brief-pulse' : ''}`}
                                            />
                                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${isOnline ? 'bg-success' : 'bg-muted/50'}`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold truncate">{u.username}</h4>
                                            <p className={`text-xs ${isOnline ? 'text-success' : 'text-muted'}`}>
                                                {isOnline ? "Online" : "Offline"}
                                            </p>
                                        </div>
                                        {unread && (
                                            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand text-on-brand text-xs font-bold flex items-center justify-center animate-notification-pulse">
                                                {unread.messageCount || 1}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted mt-16 px-6">
                            <IoChatbubbleEllipses size={36} className="mx-auto mb-3 opacity-50" />
                            <p className="font-medium text-ink">No conversations yet</p>
                            <p className="text-sm mt-1">Use the add button to find friends.</p>
                        </div>
                    )}
                </div>

                {/* Current user */}
                <Link
                    to={`${process.env.REACT_APP_BASE_URL}/profile`}
                    className="flex items-center gap-3 px-5 py-3 border-t border-line hover:bg-raised transition-colors"
                >
                    <img src={user?.profileimg || avatarFallback} alt="Profile" className="rounded-full w-10 h-10 object-cover" />
                    <div className="min-w-0">
                        <p className="font-semibold truncate leading-tight">{user?.username}</p>
                        <span className="text-xs text-success">Active now</span>
                    </div>
                </Link>
                <ToastContainer />
            </aside>

            {/* Friend requests */}
            {showPopupFriendRequest && (
                <div className={modalBackdrop}>
                    <div className={modalCard}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Friend requests</h2>
                            <button onClick={togglePopupForFriends} className="text-muted hover:text-ink text-2xl leading-none" aria-label="Close">&times;</button>
                        </div>
                        {friendRequests.length > 0 ? (
                            <ul>
                                {friendRequests.map((request, index) => (
                                    <li
                                        key={request.id}
                                        className="flex items-center mb-4 animate-slideInRight"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <img src={request.profileimg} alt={request.username} className="w-12 h-12 rounded-full object-cover mr-4" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{request.username}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAccept(request._id)} className="bg-brand hover:bg-brand-strong text-on-brand text-sm font-semibold py-1.5 px-4 rounded-full transition-colors">Accept</button>
                                            <button onClick={() => handleReject(request._id)} className="bg-raised hover:bg-line text-ink text-sm font-semibold py-1.5 px-4 rounded-full transition-colors">Reject</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted">No friend requests</p>
                        )}
                    </div>
                </div>
            )}

            {/* Add friend */}
            {showPopup && (
                <div className={modalBackdrop}>
                    <div className={`${modalCard} max-w-lg`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{!selectedUser ? 'Find people' : selectedUser.name}</h2>
                            <button onClick={togglePopup} className="text-muted hover:text-ink text-2xl leading-none" aria-label="Close">&times;</button>
                        </div>

                        {!selectedUser ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchUserPublic}
                                    onChange={(e) => setSearchUserPublic(e.target.value)}
                                    className="w-full px-4 py-2.5 mb-4 bg-raised text-ink placeholder-muted rounded-xl outline-none focus:ring-2 focus:ring-brand/40"
                                />
                                <ul className="max-h-60 overflow-y-auto">
                                    {filterPubUser.map((pubUser, index) => (
                                        <li
                                            key={pubUser._id}
                                            className="p-2 hover:bg-raised rounded-xl cursor-pointer flex items-center transition-colors duration-200 animate-slideInLeft"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                            onClick={() => setSelectedUser(pubUser)}
                                        >
                                            <img src={pubUser.profileimg} alt={pubUser.username} className="rounded-full w-10 h-10 object-cover mr-3" />
                                            <span>{pubUser.username}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <div className="animate-fadeIn">
                                <div className="flex items-center mb-6">
                                    <img src={selectedUser.profileimg} alt={selectedUser.username} className="rounded-full w-16 h-16 object-cover mr-4" />
                                    <h3 className="text-xl font-semibold">{selectedUser.username}</h3>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleAddFriend} className="flex-1 bg-brand hover:bg-brand-strong text-on-brand font-semibold py-2.5 rounded-xl transition-colors">Add friend</button>
                                    <button onClick={handleRemoveFriend} className="flex-1 bg-raised hover:bg-line text-danger font-semibold py-2.5 rounded-xl transition-colors">Remove friend</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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