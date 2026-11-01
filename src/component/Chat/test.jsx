import React, { useEffect, useContext, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import NavRail from './NavRail';
import ChatWindow from './ChatWindow';
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';
import Peer from 'peerjs';
import UserFetch from '../userFetch';
import axios from 'axios';
import forge from 'node-forge';
function Test() {
    const socket = useSocket();
    const { user } = useContext(UserContext);
    const peerInstance = useRef(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isCallPopupVisible, setCallPopupVisible] = useState(false);
    const [calluserid, setCallUserId] = useState(null);
    const [peerjsid, setPeerjsId] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sendMessage, setSendMessage] = useState(false);
    const [loadingForKey, setLoadingForKey] = useState(true);
    const username = process.env.REACT_APP_METERED_USERNAME;
    const credential = process.env.REACT_APP_METERED_PASSWORD;
    useEffect(() => {
        if (user && socket) {
            socket.emit('register', { userId: user._id });
            socket.emit('friendRequest', { ReceiverId: user._id });
        }

        return () => {
            if (socket) {
                socket.off('private_message');
            }
        };
    }, [user, socket]);
    useEffect(() => {
        if (!localStorage.getItem('privateKey') && !localStorage.getItem('publicKey')) {
            // Show loading state
            setLoadingForKey(true);

            // Use setTimeout to move the heavy computation off the main thread
            setTimeout(() => {
                try {
                    const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({ bits: 2048 });
                    localStorage.setItem('privateKey', forge.pki.privateKeyToPem(privateKey));
                    localStorage.setItem('publicKey', forge.pki.publicKeyToPem(publicKey));
                } catch (error) {
                    console.error("Error generating keys:", error);
                } finally {
                    setLoadingForKey(false);
                }
            }, 100);
        } else {
            setLoadingForKey(false); // Set loading to false if keys already exist
        }
    }, [])
    useEffect(() => {
        socket.on('voice_call', (data) => {
            console.log('Incoming call:', data);
            setIncomingCall(data);
            setCallPopupVisible(true);
            setCallType(data.callType); // Set the call type ('audio' or 'video')

            const peer = new Peer({
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: "stun:stun.relay.metered.ca:80",
                        },
                        {
                            urls: "turn:global.relay.metered.ca:80",
                            username,
                            credential,
                        },
                        {
                            urls: "turn:global.relay.metered.ca:80?transport=tcp",
                            username,
                            credential,
                        },
                        {
                            urls: "turn:global.relay.metered.ca:443",
                            username,
                            credential,
                        },
                        {
                            urls: "turns:global.relay.metered.ca:443?transport=tcp",
                            username,
                            credential,
                        },
                    ]
                }
            });
            peerInstance.current = peer;

            peer.on('open', (id) => {
                const conn = peer.connect(data.peerId);
                conn.on('open', () => {
                    conn.send('hi!');
                });
                setCallUserId(data.senderId);
                setPeerjsId(id);
            });

        });
        return () => {
            socket.off('voice_call');
        };
    }, [socket]);


    const handleAcceptCall = async () => {

        const obj = {
            toUserId: calluserid,
            peerId: peerjsid,
            senderId: user._id,
            callType: callType,
            incomingCall: incomingCall
        }
        sessionStorage.setItem('currentCall', JSON.stringify(obj))
        window.open(`${process.env.REACT_APP_BASE_URL}/incomingCall`, '_blank');
        setCallPopupVisible(false);
    };

    const handleDeclineCall = () => {
        setCallPopupVisible(false);
        socket.emit('end-call', { toUserId: incomingCall.senderId });
    };

    return (
        <div className="h-[100dvh] bg-app text-ink">
            {!loadingForKey ? (
                <div className="flex h-full">
                    <div className="hidden md:flex">
                        <NavRail />
                    </div>
                    <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-auto flex-col h-full`}>
                        <div className="flex-1 min-h-0">
                            <Sidebar setIsMenuOpen={setIsMenuOpen} sendMessage={sendMessage} />
                        </div>
                        <div className="md:hidden">
                            <NavRail horizontal />
                        </div>
                    </div>
                    <div className={`${!isMenuOpen ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 h-full`}>
                        <ChatWindow setIsMenuOpen={setIsMenuOpen} setSendMessage={setSendMessage} />
                    </div>
                    <UserFetch />
                    {isCallPopupVisible && (
                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-surface text-ink border border-line p-8 rounded-3xl shadow-2xl text-center w-full max-w-xs">
                                <p className="text-sm text-muted mb-4">Incoming call</p>
                                <img
                                    src={incomingCall?.senderProfileImg}
                                    alt="Caller"
                                    className="w-24 h-24 rounded-full object-cover mx-auto mb-3 ring-4 ring-brand/30"
                                />
                                <h2 className="text-lg font-semibold">{incomingCall?.senderName}</h2>
                                <p className="text-sm text-muted">is calling you...</p>
                                <div className="mt-6 flex justify-center gap-4">
                                    <button
                                        onClick={handleDeclineCall}
                                        className="bg-danger text-white font-semibold py-2.5 px-6 rounded-full hover:opacity-90"
                                    >
                                        Decline
                                    </button>
                                    <button
                                        onClick={handleAcceptCall}
                                        className="bg-success text-white font-semibold py-2.5 px-6 rounded-full hover:opacity-90"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="p-8 rounded-3xl bg-surface border border-line shadow-lg text-center max-w-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-line border-t-brand mx-auto mb-5"></div>
                        <h2 className="text-lg font-semibold mb-2">Preparing encryption keys</h2>
                        <p className="text-muted text-sm">
                            This may take a moment. We're generating secure keys for your messages.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Test;
