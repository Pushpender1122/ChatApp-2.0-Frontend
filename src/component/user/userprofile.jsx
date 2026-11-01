import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChatUserContext } from '../context/chatUser';
import { IoArrowBack } from 'react-icons/io5';
import ThemeToggle from '../utility/ThemeToggle';

const UserComponent = ({ user }) => {
    const [editMode, setEditMode] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profileimg);
    const navigate = useNavigate();
    const { setChatUser } = useContext(ChatUserContext);
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
                setChatUser(null);
                notify();
                setTimeout(() => {
                    navigate(`${process.env.REACT_APP_BASE_URL}/login`);
                }, 3000);
            }
        } catch (error) {
            console.error('Error logging out user:', error);
        }
    };

    const fieldClass = `w-full px-4 py-3 rounded-xl bg-surface text-ink border ${editMode ? 'border-brand ring-2 ring-brand/20' : 'border-line'} disabled:opacity-80 outline-none`;
    return (
        <div className="min-h-screen bg-app text-ink">
            <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 bg-surface border-b border-line">
                <button
                    onClick={() => navigate(`/`)}
                    className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
                >
                    <IoArrowBack size={18} /> Back to chats
                </button>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="bg-danger/10 hover:bg-danger/20 text-danger font-semibold py-2 px-4 rounded-full text-sm"
                    >
                        Log out
                    </button>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-sm">
                    <div className="h-28 bg-brand-soft" />
                    <div className="px-6 md:px-10 pb-10">
                        <div className="flex flex-wrap items-end justify-between gap-4 -mt-14">
                            <div className="relative w-28 h-28">
                                <img
                                    src={profileImage || 'https://via.placeholder.com/150'}
                                    alt={userData?.username}
                                    className="rounded-full w-full h-full object-cover border-4 border-surface bg-raised"
                                />
                                {editMode && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        aria-label="Change profile photo"
                                    />
                                )}
                            </div>
                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="bg-brand hover:bg-brand-strong text-on-brand font-semibold py-2 px-5 rounded-full"
                                >
                                    Edit profile
                                </button>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold mt-4">{userData?.username}</h1>
                        <p className="text-muted">{userData?.email}</p>

                        <div className="mt-8 space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Username</label>
                                <input type="text" name="username" value={userData?.username || ''} onChange={handleInputChange} disabled={!editMode} className={fieldClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <input type="email" name="email" value={userData?.email || ''} onChange={handleInputChange} disabled={!editMode} className={fieldClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">About</label>
                                <textarea name="description" value={userData?.description || ''} onChange={handleInputChange} disabled={!editMode} className={fieldClass} rows="5"></textarea>
                            </div>
                        </div>

                        {editMode && (
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="bg-raised hover:bg-line text-ink font-semibold py-2 px-5 rounded-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-brand hover:bg-brand-strong text-on-brand font-semibold py-2 px-5 rounded-full"
                                >
                                    Save changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <ToastContainer />
        </div>
    );
};

export default UserComponent;
