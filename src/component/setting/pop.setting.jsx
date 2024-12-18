import React from 'react';
import axios from 'axios';
const UserDetailsPopup = ({ currentUser, user, onClose, setChatUser, socket, setUser, setImageZoomShowModal }) => {
    if (!user) return null;
    // const handleRemoveFriend = () => {
    //     onRemoveFriend(user._id);
    //     onClose(); // Close the popup after removing the friend
    // };

    const handleRemoveFriend = async () => {

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/removefriend`, {
                friendId: user.id,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.data.message === 'Friend removed successfully') {
                // if (selectedUser) {
                socket.emit('friendRemove', { senderId: currentUser._id, ReceiverId: user.id });
                setUser(null)
                onClose();
                // }
                // console.log(selectedUser._id, user._id, chatUser.id);
                if (user.id) {
                    setChatUser(null);
                }
                // window.location.reload();
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };
    return (
        <div className="fixed inset-1 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-lg"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex items-start">
                    {/* User Image */}
                    <img
                        src={user.profileimg}
                        alt={user.username}
                        className="rounded-full w-24 h-24 mr-6 cursor-pointer"
                        onClick={() => setImageZoomShowModal(true)}
                    />
                    <div>
                        {/* User Details */}
                        <h3 className="text-xl font-semibold text-gray-800">{user.username}</h3>
                        <p className="text-gray-600">Email : {user.email}</p>
                        <p className="text-gray-600">Bio : {user.description}</p>
                    </div>
                </div>

                <div className="mt-4">
                    {/* Remove Friend Button */}
                    <button
                        onClick={handleRemoveFriend}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Remove Friend
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsPopup;
