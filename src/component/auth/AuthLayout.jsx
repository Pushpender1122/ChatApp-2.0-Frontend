import React from 'react';
import { IoChatbubbleEllipses } from 'react-icons/io5';

export const AuthLayout = ({ title, subtitle, error, children, footer }) => (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-2 mb-8">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <IoChatbubbleEllipses size={22} />
                </span>
                <span className="text-2xl font-bold text-white tracking-tight">RealTalk</span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
                {error && (
                    <div role="alert" className="mt-5 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                        {error}
                    </div>
                )}
                {children}
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">{footer}</p>
        </div>
    </div>
);

export const AuthField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <input
            id={id}
            {...props}
            className="w-full px-4 py-3 rounded-xl bg-gray-900/70 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 transition"
        />
    </div>
);

export const primaryBtn = 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed';
export const secondaryBtn = 'w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-medium py-3 px-4 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed';
