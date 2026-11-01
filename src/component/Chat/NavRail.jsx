import React, { useContext } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { IoChatbubbleEllipses, IoPerson, IoLogOut } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { ChatUserContext } from '../context/chatUser';
import ThemeToggle from '../utility/ThemeToggle';

const linkClass = ({ isActive }) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-raised'}`;

// Slim navigation: vertical rail on desktop, bottom bar on mobile
function NavRail({ horizontal = false }) {
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
        <nav
            className={horizontal
                ? 'flex items-center justify-around px-4 py-2 bg-surface border-t border-line'
                : 'flex flex-col items-center justify-between w-[72px] h-full py-5 bg-surface border-r border-line'}
        >
            <div className={horizontal ? 'contents' : 'flex flex-col items-center gap-2'}>
                {!horizontal && (
                    <span className="w-10 h-10 rounded-xl bg-brand text-on-brand flex items-center justify-center mb-4">
                        <IoChatbubbleEllipses size={22} />
                    </span>
                )}
                <NavLink to="/" end className={linkClass} aria-label="Chats" title="Chats">
                    <IoChatbubbleEllipses size={20} />
                </NavLink>
                <NavLink to={`${process.env.REACT_APP_BASE_URL}/profile`} className={linkClass} aria-label="Profile" title="Profile">
                    <IoPerson size={20} />
                </NavLink>
            </div>
            <div className={horizontal ? 'contents' : 'flex flex-col gap-2'}>
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    aria-label="Log out"
                    title="Log out"
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-danger hover:bg-raised transition-colors"
                >
                    <IoLogOut size={22} />
                </button>
            </div>
        </nav>
    );
}

export default NavRail;
