import React, { useEffect, useContext } from 'react';
import { UserContext } from './context/user';

const UserFetch = () => {
    const { user, setUser } = useContext(UserContext);

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
                setUser(data.user);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        console.log("UserFetch compon");
        if (user == null) {
            fetchUser();
        }
    }, [setUser, user]);

    return null;
};

export default UserFetch;