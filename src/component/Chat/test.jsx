import React, { useEffect, useContext, useRef, useState } from 'react';
import Sidebar from './Sidebar';
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
            const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({ bits: 2048 });
            localStorage.setItem('privateKey', forge.pki.privateKeyToPem(privateKey));
            localStorage.setItem('publicKey', forge.pki.publicKeyToPem(publicKey));
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
        <div className="flex bg-gray-900 h-[93vh] md:h-screen">{/* style={{ 'height': '93vh' }} */}
            <div className="hidden md:block"> {/* Hidden on small screens, visible on medium and above */}
                <Sidebar setIsMenuOpen={setIsMenuOpen} sendMessage={sendMessage} />
            </div>
            {isMenuOpen && <Sidebar setIsMenuOpen={setIsMenuOpen} sendMessage={sendMessage} />}
            {!isMenuOpen && <ChatWindow setIsMenuOpen={setIsMenuOpen} setSendMessage={setSendMessage} />}
            <UserFetch />
            {/* Incoming Call Popup */}
            {isCallPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-4">Incoming Call</h2>
                        <img
                            src={incomingCall?.senderProfileImg}
                            alt="Caller"
                            className="w-20 h-20 rounded-full mx-auto mb-2"
                        />
                        <p>{incomingCall?.senderName} is calling you...</p>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={handleAcceptCall}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Accept
                            </button>
                            <button
                                onClick={handleDeclineCall}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Test;
