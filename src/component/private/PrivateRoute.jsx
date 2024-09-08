import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
// import Cookies from 'js-cookie';

const PrivateRoute = () => {
    let isLogin = localStorage.getItem('token');
    return (
        !isLogin ? <Navigate to={`${process.env.REACT_APP_BASE_URL}/login`} /> : <Outlet />
    );
};

export default PrivateRoute;
