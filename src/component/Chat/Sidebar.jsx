import axios from "axios";
import { useEffect, useState } from "react";
import React from 'react';
import { UserContext } from "../context/user";
import { useContext } from "react";
import { ChatUserContext } from '../context/chatUser';
import { useSocket } from '../context/socketContext';
import { IoIosNotifications, IoMdSettings } from "react-icons/io";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function Sidebar({ setIsMenuOpen }) {
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
    const [alertmsg, setAlertmsg] = useState({
        message: '',
        type: 'success',
    });
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
            console.log(response.data);
            if (response.status === 200) {
                setFriendRequests((prevRequests) =>
                    prevRequests.filter((request) => request._id !== id)
                );
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
            setFilterPublicList(response.data.filter((use) => use._id !== user?._id));
            setUsers(response.data);

            // console.log("This is getAlluser", response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };
    useEffect(() => {
        // Fetch users when the component mounts
        getUser();
    }, []);
    useEffect(() => {
        if (user) {
            setUsers(users.filter((use) => use._id !== user?._id));
            setMessageNotification(user.messageStatus);
        }
    }, [user]);
    useEffect(() => {
        socket.on('FriendRemove', (data) => {
            // console.log('FriendRemove:', data);
            setFriends(prevFriends => prevFriends.filter(f => f._id !== data.senderId));
            setChatUser(null);
        })
    }, []);
    useEffect(() => {
        if (user && users) {
            // console.log("This is users for 39 sidebar", users);
            setFriends([]);
            users.forEach((use) => {
                if (user.friends?.includes(use._id)) {
                    setFriends((prevFriends) => [...prevFriends, use]);
                }
            });
        }
    }, [user, users]);
    // Filter users based on search term
    const filteredUsers = friends.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const handleChangeUser = (id, username, profileimg, email, description) => {
        setIsMenuOpen(false);
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
        // alert(`${selectedUser.username} has been added as a friend!`);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/addFriend`, {
                friendId: selectedUser._id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.data.message === 'Friend added successfully') {
                // console.log('Friend added ram ram', user._id);   
                setAlertmsg({
                    message: response.data.message,
                    type: 'success',
                });
                socket.emit('friendRequest', { ReceiverId: selectedUser._id });
            }
            // console.log('Friend added:', response.data.message);
            setShowPopup(!showPopup);
            setSelectedUser(null);
        } catch (error) {
            setAlertmsg({
                message: error.response.data.message,
                type: 'error',
            });
            console.error('Error adding friend:', error);
        }

        // setShowPopup(!showPopup);
    };
    useEffect(() => {
        if (alertmsg.message !== '') {
            notify();
        }
    }, [alertmsg]);
    const handleRemoveFriend = async () => {
        // alert(`${selectedUser.username} has been removed as a friend!`);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/removefriend`, {
                friendId: selectedUser._id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.data.message === 'Friend removed successfully') {
                // console.log('Friend removed:', response.data.message);
                setAlertmsg({
                    message: response.data.message,
                    type: 'success',
                });
                if (selectedUser) {
                    setFriends(prevFriends => prevFriends.filter(f => f._id !== selectedUser._id));
                    socket.emit('friendRemove', { senderId: user._id, ReceiverId: selectedUser._id });
                }
                // console.log(selectedUser._id, user._id, chatUser.id);
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
        const fetchFriendDetails = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/friendDetails`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                // getUser();
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
            setMessageNotification((prevMessages) => [...prevMessages, { userId: data.SenderID, status: true }]);
        });
        socket.on('friendNotification', ({ count }) => {
            setNotificationCount(count);
        });
    }, [socket]);
    useEffect(() => {
        socket.on('FriendAcceptAck', () => {
            setUser(null);
        })
    }, [])
    return (
        <>
            <div className="w-10/12 md:w-72 bg-gray-800 text-white flex flex-col p-4 h-full ">
                {/* Profile Section */}
                <div className="flex items-center mb-5">
                    <img
                        src={user?.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                        alt="Shikha Gupta"
                        className="rounded-full w-12 h-12 mr-3"
                    />
                    <div className="flex-1">
                        <h2 className="font-semibold text-lg">{user?.username}</h2>
                        <span className="text-sm text-gray-400">Active Now</span>
                    </div>
                    <Link to={`${process.env.REACT_APP_BASE_URL}/profile`}>
                        <IoMdSettings style={{ 'marginRight': '1em' }} className="cursor-pointer" />
                    </Link>
                    <button onClick={togglePopup} className="bg-pink-500 text-white text-lg p-2 rounded-full" style={{
                        height: '1.7rem',
                        width: '1.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>+</button>
                    <div className="relative inline-block">
                        <button
                            className="p-2 bg-gray-700 rounded-full text-white ml-2"
                            onClick={togglePopupForFriends}
                        >
                            <IoIosNotifications />
                        </button>

                        {notificationCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform translate-x-1/2 -translate-y-1/2">
                                {notificationCount}
                            </span>
                        )}
                    </div>
                    {/* Popup for Friend Requests */}
                    {showPopupFriendRequest && (
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Friend Requests</h2>
                                    <button
                                        onClick={togglePopupForFriends}
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
                </div>

                {/* Popup */}
                {showPopup && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
                            <div className="flex justify-between items-center mb-4">
                                {!selectedUser ? (
                                    <h2 className="text-2xl font-bold` text-gray-800">Select User</h2>
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h2>
                                )}
                                <button
                                    onClick={togglePopup}
                                    className="text-gray-500 hover:text-gray-800 text-lg"
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
                                        className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
                                    />

                                    {/* User List */}
                                    <ul className="max-h-60 overflow-y-auto">
                                        {filterPublicList.map((user) => (
                                            <li
                                                key={user._id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
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
                                <div>
                                    {/* User Profile */}
                                    <div className="flex items-center mb-4">
                                        <img
                                            src={selectedUser.profileimg}
                                            alt={selectedUser.username}
                                            className="rounded-full w-16 h-16 mr-4"
                                        />
                                        <div>
                                            <h3 className="text-xl font-semibold text-black">{selectedUser.username}</h3>
                                        </div>
                                    </div>

                                    {/* Add/Remove Friend Buttons */}
                                    <div className="flex justify-between">
                                        <button
                                            onClick={handleAddFriend}
                                            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                                        >
                                            Add Friend
                                        </button>
                                        <button
                                            onClick={handleRemoveFriend}
                                            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
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
                    <h3 className="text-sm text-gray-400 mb-2 hide-scrollbar">ACTIVE NOW</h3>
                    <div className="space-y-3 hide-scrollbar ">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(u => (
                                <div key={u._id} className="flex items-center p-2 bg-gray-700 rounded-lg cursor-pointer" onClick={() => handleChangeUser(u._id, u.username, u.profileimg, u.email, u.description)}>
                                    <img
                                        src={u.profileimg || "https://images.unsplash.com/photo-1724086572650-685ff295750e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D"}
                                        alt={u.username}
                                        className="rounded-full w-10 h-10 mr-3"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold" >{u.username}</h4>
                                        <p className="text-xs text-gray-400">Now</p>
                                    </div>
                                    {messageNotification.some((m) => m.userId === u._id && m.status === true) && (
                                        <div className="w-2 h-2  rounded-full text-sm" style={{ backgroundColor: 'rgb(1 122 160)' }}></div>
                                    )}
                                    {console.log("This is messageNotification", messageNotification)}

                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">No users found</p>
                        )}
                        <ToastContainer />
                    </div>
                </div>
            </div >
            <div className="z-50  w-auto md:hidden" style={{ color: 'rgb(17 24 39 / var(--tw-bg-opacity))' }} onClick={() => setIsMenuOpen(false)}>div test te</div>
        </>
    );
}

export default Sidebar;
