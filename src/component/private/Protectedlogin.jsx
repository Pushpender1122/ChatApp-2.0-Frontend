import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
// import Cookies from 'js-cookie';

const Protectedlogin = () => {
    let isLogin = localStorage.getItem('token');
    return (
        isLogin ? <Navigate to={'/'} /> : <Outlet />
    );
};

export default Protectedlogin;
