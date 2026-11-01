import React from 'react';
import { IoChatbubbleEllipses, IoLockClosed, IoImages, IoCall } from 'react-icons/io5';
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-app">
        <aside className="hidden lg:flex flex-col justify-between p-12 bg-brand-soft border-r border-line">
            <Logo />
            <div>
                <h2 className="text-4xl font-bold text-ink leading-tight max-w-md">
                    Conversations that feel effortless.
                </h2>
                <ul className="mt-10 space-y-6 max-w-md">
                    {highlights.map(({ icon: Icon, title: t, text }) => (
                        <li key={t} className="flex gap-4">
                            <span className="shrink-0 w-11 h-11 rounded-xl bg-surface text-brand flex items-center justify-center shadow-sm">
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

        <main className="relative flex items-center justify-center px-6 py-12">
            <ThemeToggle className="absolute top-4 right-4" />
            <div className="w-full max-w-sm">
                <Logo className="lg:hidden mb-8" />
                <h1 className="text-3xl font-bold text-ink">{title}</h1>
                <p className="text-muted mt-2">{subtitle}</p>
                {error && (
                    <div role="alert" className="mt-6 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}
                {children}
                <p className="text-sm text-muted mt-8">{footer}</p>
            </div>
        </main>
    </div>
);

export const AuthField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">{label}</label>
        <input
            id={id}
            {...props}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-line text-ink placeholder-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60 transition"
        />
    </div>
);

export const primaryBtn = 'w-full bg-brand hover:bg-brand-strong text-on-brand font-semibold py-3 px-4 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed';
export const secondaryBtn = 'w-full bg-surface hover:bg-raised border border-line text-ink font-medium py-3 px-4 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed';
