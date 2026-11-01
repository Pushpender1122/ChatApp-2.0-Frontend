import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user';
import { useTheme } from '../context/theme';
import { AuthLayout, AuthField, primaryBtn, secondaryBtn } from './AuthLayout';

const Login = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [templogin, setTemplogin] = useState(false);
    const { setUser } = useContext(UserContext);
    const notify = () => toast.success("Login Successful!", {
        autoClose: 2000,
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!templogin) {
            if (!email || !password) {
                setError('All fields are required');
                setLoading(false);
                return;
            }
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}${templogin ? '/templogin' : '/login'}`, {
                email,
                password,
            });

            const { token } = response.data;

            // Save JWT token in localStorage
            localStorage.setItem('token', token);
            notify()

            setEmail('');
            setPassword('');
            setTimeout(() => {
                setUser(null);
                navigate('/');
            }, 3000);
        } catch (err) {
            console.error('Error during login:', err);
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
            setTemplogin(false);
        }
    };
    useEffect(() => {
        const getAllUser = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/getalluser`);
                if (response.status === 200) {
                    response.data.forEach((u) => {
                        localStorage.removeItem(u._id);
                    })
                }
            } catch (err) {
                console.error('Error clearing keys:', err);
            }
            localStorage.removeItem('token');
            localStorage.removeItem('privateKey');
            localStorage.removeItem('publicKey');
        }
        getAllUser();
    }, [])
    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to pick up your conversations."
            error={error}
            footer={<>New here? <Link to={`${process.env.REACT_APP_BASE_URL}/signup`} className="text-brand hover:text-brand-strong font-semibold">Create an account</Link></>}
        >
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <AuthField
                    label="Email"
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
                <AuthField
                    label="Password"
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className={primaryBtn} disabled={loading}>
                    {loading && !templogin ? 'Logging in...' : 'Log in'}
                </button>
                <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex-1 h-px bg-line" />or<span className="flex-1 h-px bg-line" />
                </div>
                <button
                    type="submit"
                    className={secondaryBtn}
                    disabled={loading}
                    onClick={() => setTemplogin(true)}
                >
                    {loading && templogin ? 'Logging in...' : 'Continue as guest'}
                </button>
            </form>
            <ToastContainer theme={theme} />
        </AuthLayout>
    );
};

export default Login;
