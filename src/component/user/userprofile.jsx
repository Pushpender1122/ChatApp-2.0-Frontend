import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserComponent = ({ user }) => {
    const [editMode, setEditMode] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profileimg);
    const navigate = useNavigate();
    const notify = () => toast.info("Logout Successful!", {
        autoClose: 2000,
    });
    const [userData, setUserData] = useState({
        username: user?.username,
        email: user?.email,
        description: user?.description,
        profileImage: user?.profileimg,
    });

    useEffect(() => {
        setUserData({
            username: user?.username,
            email: user?.email,
            description: user?.description,
            profileImage: user?.profileimg,
        });
        setProfileImage(user?.profileimg);
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData({
            ...userData,
            [name]: value,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setUserData({
            ...userData,
            profileImage: file,
        });
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result);
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('img', userData.profileImage);
        formData.append('username', userData.username);
        formData.append('email', userData.email);
        formData.append('description', userData.description);
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/updateUser`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setEditMode(false);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/logout`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.status === 200) {
                localStorage.removeItem('token');
                notify();
                setTimeout(() => {
                    navigate(`${process.env.REACT_APP_BASE_URL}/login`);
                }, 3000);
            }
        } catch (error) {
            console.error('Error logging out user:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark-blue-900 text-white px-4 md:px-8">
            <div className="w-full md:w-3/4 p-8 bg-black shadow-lg" style={{ 'height': '100vh', 'width': '100vw' }}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-light-blue-500">User Profile</h1>
                    {!editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="bg-light-blue-500 hover:bg-light-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Edit Profile
                        </button>
                    )}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate(`/`)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Chat
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12">
                    <div className="flex-none">
                        <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto">
                            <img
                                src={profileImage || 'https://via.placeholder.com/150'}
                                alt={userData?.username}
                                className="rounded-full w-full h-full object-cover"
                            />
                            {editMode && (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex-grow space-y-6">
                        <div>
                            <label className="block text-light-blue-500 font-semibold">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={userData?.username}
                                onChange={handleInputChange}
                                disabled={!editMode}
                                className={`w-full p-3 rounded-lg bg-gray-800 text-white ${editMode ? 'border-2 border-light-blue-500' : 'border-none'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-light-blue-500 font-semibold">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={userData?.email}
                                onChange={handleInputChange}
                                disabled={!editMode}
                                className={`w-full p-3 rounded-lg bg-gray-800 text-white ${editMode ? 'border-2 border-light-blue-500' : 'border-none'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-light-blue-500 font-semibold">Description</label>
                            <textarea
                                name="description"
                                value={userData?.description}
                                onChange={handleInputChange}
                                disabled={!editMode}
                                className={`w-full p-3 rounded-lg bg-gray-800 text-white ${editMode ? 'border-2 border-light-blue-500' : 'border-none'
                                    }`}
                                rows="6"
                            ></textarea>
                        </div>
                    </div>
                </div>
                {editMode && (
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            onClick={() => setEditMode(false)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default UserComponent;
