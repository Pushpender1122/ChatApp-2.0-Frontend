import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, AuthField, primaryBtn } from './AuthLayout';

const Signup = () => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const notify = () => toast.success("Registered Successfully!", {
        autoClose: 2000,
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!username || !email || !password) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/registeruser`, {
                username,
                email,
                password,
            });

            notify()
            setUsername('');
            setEmail('');
            setPassword('');
            setTimeout(() => {
                navigate(`${process.env.REACT_APP_BASE_URL}/login`);
            }, 2000);
        } catch (err) {
            console.error('Error during signup:', err);
            if (err.response && err.response.data) {
                setError(err.response.data.message || 'An error occurred during signup.');
            } else {
                setError('Network error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Join RealTalk and start chatting in seconds."
            error={error}
            footer={<>Already have an account? <Link to={`${process.env.REACT_APP_BASE_URL}/login`} className="text-blue-300 hover:text-blue-200 font-semibold">Log in</Link></>}
        >
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <AuthField label="Username" id="username" type="text" autoComplete="username" placeholder="Your name" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
                <AuthField label="Email" id="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                <AuthField label="Password" id="password" type="password" autoComplete="new-password" placeholder="Create a password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                <button type="submit" className={primaryBtn} disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign up'}
                </button>
            </form>
            <ToastContainer theme="dark" />
        </AuthLayout>
    );
};

export default Signup;
