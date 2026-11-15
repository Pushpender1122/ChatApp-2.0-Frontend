import React from 'react';
import { IoChatbubbleEllipses, IoLockClosed, IoImages, IoCall } from 'react-icons/io5';
import { Alert, Paper, TextField } from '@mui/material';
import ThemeToggle from '../utility/ThemeToggle';

const highlights = [
    { icon: IoLockClosed, title: 'Private by design', text: 'Messages are end-to-end encrypted on your device.' },
    { icon: IoImages, title: 'Share anything', text: 'Send photos and videos in a single drop.' },
    { icon: IoCall, title: 'Talk face to face', text: 'Crystal clear voice and video calls.' },
];

export const Logo = ({ className = '' }) => (
    <div className={`flex items-center gap-2.5 ${className}`}>
        <span className="w-10 h-10 rounded-xl bg-brand text-on-brand flex items-center justify-center">
            <IoChatbubbleEllipses size={22} />
        </span>
        <span className="text-xl font-bold tracking-tight text-ink">RealTalk</span>
    </div>
);

export const AuthLayout = ({ title, subtitle, error, children, footer }) => (
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_1fr] bg-app">
        <aside className="hidden lg:flex flex-col justify-between p-12 bg-surface border-r border-line">
            <Logo />
            <div className="max-w-lg">
                <span className="inline-flex text-xs font-semibold uppercase tracking-wider text-brand bg-brand-soft px-3 py-1.5 rounded-lg mb-6">Welcome to RealTalk</span>
                <h2 className="text-4xl font-bold text-ink leading-tight">
                    Better conversations, all in one place.
                </h2>
                <p className="text-muted mt-4 leading-relaxed">A simple space to stay in touch, share moments and connect with the people who matter.</p>
                <ul className="mt-10 space-y-5">
                    {highlights.map(({ icon: Icon, title: t, text }) => (
                        <li key={t} className="flex gap-4">
                            <span className="shrink-0 w-11 h-11 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                                <Icon size={20} />
                            </span>
                            <div>
                                <p className="font-semibold text-ink">{t}</p>
                                <p className="text-sm text-muted">{text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <p className="text-sm text-muted">© RealTalk</p>
        </aside>

        <main className="relative flex items-center justify-center px-4 sm:px-6 py-16">
            <ThemeToggle className="absolute top-4 right-4" />
            <Paper variant="outlined" className="w-full max-w-md rounded-2xl p-6 sm:p-10">
                <Logo className="lg:hidden mb-8" />
                <h1 className="text-2xl font-bold text-ink">{title}</h1>
                <p className="text-muted mt-2">{subtitle}</p>
                {error && (
                    <Alert severity="error" className="mt-6">
                        {error}
                    </Alert>
                )}
                {children}
                <p className="text-sm text-muted mt-8">{footer}</p>
            </Paper>
        </main>
    </div>
);

export const AuthField = ({ label, id, ...props }) => (
    <TextField fullWidth variant="outlined" label={label} id={id} {...props} />
);
