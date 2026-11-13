import React, { useContext } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { IoChatbubbleEllipses, IoPerson, IoLogOut } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { AppBar, IconButton, Toolbar } from '@mui/material';
import { ChatUserContext } from '../context/chatUser';
import ThemeToggle from '../utility/ThemeToggle';

const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-raised'}`;

function NavRail({ onShowChats }) {
    const navigate = useNavigate();
    const { setChatUser } = useContext(ChatUserContext);

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
                toast.info('Logged out');
                navigate(`${process.env.REACT_APP_BASE_URL}/login`);
            }
        } catch (error) {
            console.error('Error logging out user:', error);
            toast.error('Could not log out. Try again.');
        }
    };

    return (
        <AppBar component="nav" position="static" color="transparent" elevation={0} aria-label="Main navigation" className="bg-surface border-b border-line">
            <Toolbar disableGutters className="w-full max-w-[1440px] mx-auto flex items-center gap-3 px-4 md:px-8 h-16">
                <NavLink to="/" onClick={onShowChats} className="flex items-center gap-2 mr-auto md:mr-8" aria-label="RealTalk home">
                    <span className="w-9 h-9 rounded-lg bg-brand text-on-brand flex items-center justify-center">
                        <IoChatbubbleEllipses size={22} />
                    </span>
                    <span className="text-lg font-bold tracking-tight text-ink">RealTalk</span>
                </NavLink>
                <NavLink to="/" end onClick={onShowChats} className={linkClass} aria-label="Chats" title="Chats">
                    <IoChatbubbleEllipses size={18} /><span className="hidden sm:inline">Chats</span>
                </NavLink>
                <NavLink to={`${process.env.REACT_APP_BASE_URL}/profile`} className={linkClass} aria-label="Profile" title="Profile">
                    <IoPerson size={18} /><span className="hidden sm:inline">Profile</span>
                </NavLink>
                <div className="hidden md:block flex-1" />
                <ThemeToggle />
                <IconButton
                    onClick={handleLogout}
                    aria-label="Log out"
                    title="Log out"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-danger hover:bg-raised transition-colors"
                >
                    <IoLogOut size={22} />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}

export default NavRail;
