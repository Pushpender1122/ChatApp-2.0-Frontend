import React, { useEffect, useContext } from 'react';
import { UserContext } from './context/user';
import { useNavigate } from 'react-router-dom';

const UserFetch = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/getUser`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (data.message === 'Invalid token.') {
                    localStorage.removeItem('token');
                    setUser(null);
                    navigate('/api/v1/login');
                    return;
                }
                setUser(data.user);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        console.log("UserFetch compon");
        if (user == null) {
            fetchUser();
        }
    }, [user]);

    return null;
};

export default UserFetch;