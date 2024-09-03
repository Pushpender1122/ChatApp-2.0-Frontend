import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset error state before submission
        setLoading(true); // Show loading state

        // Basic validation
        if (!username || !email || !password) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/registeruser`, {
                username,
                email,
                password,
            });

            console.log('Signup successful:', response.data);
            // onSignup(response.data); // Call parent function with response data
            console.log(response.data);
            // Clear form fields after successful submission
            alert("User Registered Successfully");
            setUsername('');
            setEmail('');
            setPassword('');
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">Sign Up</h2>
                {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-gray-700">Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
