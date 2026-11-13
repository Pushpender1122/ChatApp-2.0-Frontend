import React from 'react';
import axios from 'axios';
import { Button, Paper } from '@mui/material';
import Avatar from '../utility/Avatar';
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
                localStorage.removeItem(user.id);
                // window.location.reload();
            }
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Paper variant="outlined" className="text-ink rounded-3xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Contact info</h2>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-ink text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex items-start">
                    {/* User Image */}
                    <Avatar
                        src={user.profileimg}
                        alt={user.username}
                        className="rounded-full w-24 h-24 object-cover mr-6 cursor-pointer"
                        onClick={() => setImageZoomShowModal(true)}
                    />
                    <div>
                        {/* User Details */}
                        <h3 className="text-xl font-semibold">{user.username}</h3>
                        <p className="text-muted">Email : {user.email}</p>
                        <p className="text-muted">Bio : {user.description}</p>
                    </div>
                </div>

                <div className="mt-4">
                    {/* Remove Friend Button */}
                    <Button
                        onClick={handleRemoveFriend}
                        color="error"
                        variant="outlined"
                    >
                        Remove Friend
                    </Button>
                </div>
            </Paper>
        </div>
    );
};

export default UserDetailsPopup;
