import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/socketContext';
import Peer from 'peerjs';
import { FaMicrophone, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';

const VoiceCall = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const chatUser = JSON.parse(sessionStorage.getItem('chatUser'));
    const value = sessionStorage.getItem('value');
    const socket = useSocket();
    const [localStream, setLocalStream] = useState(null);
    const [showCallPopup, setShowCallPopup] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoHidden, setIsVideoHidden] = useState(false);

    const peerInstance = useRef(null);
    const username = process.env.REACT_APP_METERED_USERNAME;
    const credential = process.env.REACT_APP_METERED_PASSWORD;
    useEffect(() => {
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
            console.log('My peer ID is: ' + id);
            socket.emit('voice_call', {
                toUserId: chatUser?.id,
                peerId: id,
                senderId: user?._id,
                senderName: user?.username,
                senderProfileImg: user?.profileimg,
                callType: value,
            });
        });

        peer.on('call', (call) => {
            if (localStream) {
                call.answer(localStream);
                call.on('stream', (stream) => {
                    setRemoteStream(stream);
                });
            }
        });

        const getUserMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: value === 'video',
                });
                setLocalStream(stream);
                return stream;
            } catch (error) {
                console.error('Error getting user media:', error);
            }
        };

        const handleCall = async () => {
            const stream = await getUserMedia();
            socket.on('user-connected', (data) => {
                console.log('User connected:', data);
                const call = peer.call(data.peerId, stream);
                call?.on('stream', (remoteStream) => {
                    setRemoteStream(remoteStream);
                    setIsCalling(false);
                });
            });
        };

        handleCall();
        setIsCalling(true);
        setShowCallPopup(true);
        return () => {
            peerInstance.current?.destroy();
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, [socket]);

    const toggleMute = () => {
        if (localStream) {
            const newIsMuted = !isMuted;
            localStream.getAudioTracks().forEach(track => (track.enabled = !newIsMuted));
            setIsMuted(newIsMuted);
        }
    };

    const toggleVideoHide = () => {
        if (localStream) {
            const newIsVideoHidden = !isVideoHidden;
            localStream.getVideoTracks().forEach(track => (track.enabled = !newIsVideoHidden));
            setIsVideoHidden(newIsVideoHidden);
        }
    };

    const handleCallDisconnect = () => {
        // onClose(false);
        setShowCallPopup(false);
        peerInstance.current?.disconnect();
        peerInstance.current?.destroy();
        localStream?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        socket.emit('end-call', { toUserId: chatUser?.id });
        window.close();
    };

    useEffect(() => {
        socket.on('end-call', () => {
            setShowCallPopup(false);
            peerInstance.current?.disconnect();
            peerInstance.current?.destroy();
            localStream?.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            sessionStorage.removeItem('chatUser');
            sessionStorage.removeItem('value');
            sessionStorage.removeItem('user');
            window.close();
            // onClose(false);
        });
    }, [localStream, socket]);
    if (!chatUser || !user || !value) {
        window.open('/', '_self');
    }
    console.log(socket.id)
    return (
        <div >
            {/* <h1>{value === 'video' ? 'Video Call' : 'Voice Call'}</h1> */}
            {showCallPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 flex-col md:flex-row" style={{ background: 'black' }}>
                    {localStream && value === 'video' && (
                        <div className="relative flex flex-col items-center">
                            {isVideoHidden ? (
                                <img
                                    src={chatUser.profileimg} // Placeholder image URL
                                    alt="Placeholder"
                                    className="w-64 max-w-md"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            ) : (
                                <video
                                    ref={(video) => video && (video.srcObject = localStream)}
                                    autoPlay
                                    muted
                                    className="w-full max-w-md"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            )}
                            <div className="absolute bottom-0 mb-4 flex space-x-4">
                                <button
                                    onClick={toggleMute}
                                    className={`${isMuted ? 'bg-gray-500' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                                >
                                    <FaMicrophone />
                                </button>

                                <button
                                    onClick={handleCallDisconnect}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <FaPhoneSlash />
                                </button>

                                <button
                                    onClick={toggleVideoHide}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <FaVideoSlash />
                                </button>
                            </div>
                        </div>
                    )}

                    {remoteStream && value === 'video' && (
                        <video
                            ref={(video) => video && (video.srcObject = remoteStream)}
                            autoPlay
                            className="w-full max-w-md"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    )}

                    {value !== 'video' && (
                        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                            <img
                                src={chatUser?.profileimg || "https://via.placeholder.com/150"}
                                alt="User Avatar"
                                className="rounded-full w-24 h-24 mb-4"
                            />
                            <h2 className="text-lg font-bold mb-4">Calling {chatUser?.username}...</h2>

                            {isCalling ? <p>Connecting...</p> : <p>Connected</p>}

                            <div className="flex space-x-4 mt-4">
                                <button
                                    onClick={toggleMute}
                                    className={`${isMuted ? 'bg-gray-500' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                                >
                                    {isMuted ? 'Unmute' : 'Mute'}
                                </button>

                                <button
                                    onClick={handleCallDisconnect}
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    End Call
                                </button>
                            </div>
                            <audio ref={(audio) => audio && (audio.srcObject = remoteStream)} autoPlay />
                        </div>

                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceCall;
