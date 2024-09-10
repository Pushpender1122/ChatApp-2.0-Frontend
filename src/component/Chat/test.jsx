import React, { useEffect, useContext, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';
import Peer from 'peerjs';
import { FaMicrophone, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';
import UserFetch from '../userFetch';
function Test() {
    const socket = useSocket();
    const { user } = useContext(UserContext);
    const peerInstance = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isCallPopupVisible, setCallPopupVisible] = useState(false);
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [calluserid, setCallUserId] = useState(null);
    const [peerjsid, setPeerjsId] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isVideoHidden, setIsVideoHidden] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                        // {
                        //     urls: "turn:global.relay.metered.ca:80",
                        //     username,
                        //     credential,
                        // },
                        // {
                        //     urls: "turn:global.relay.metered.ca:80?transport=tcp",
                        //     username,
                        //     credential,
                        // },
                        // {
                        //     urls: "turn:global.relay.metered.ca:443",
                        //     username,
                        //     credential,
                        // },
                        // {
                        //     urls: "turns:global.relay.metered.ca:443?transport=tcp",
                        //     username,
                        //     credential,
                        // },
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

            const getUserMedia = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: true,
                    });
                    console.log('Local stream:', stream);
                    setLocalStream(stream);
                    return stream;
                } catch (error) {
                    console.error('Error getting user media:', error);
                }
            };

            const handleAnswerCall = async () => {
                const stream = await getUserMedia();
                peer.on('call', (call) => {
                    call.answer(stream);
                    call.on('stream', (remoteStream) => {
                        setRemoteStream(remoteStream);
                    });
                });
            };
        });
        return () => {
            socket.off('voice_call');
        };
    }, [socket]);


    useEffect(() => {
        socket.on('end-call', () => {
            removeCallTrack();
            setIsInCall(false);
            peerInstance.current?.disconnect();
            peerInstance.current?.destroy();
        });
    }, [localStream]);

    const getUserMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' ? true : false });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error getting user media:', error);
        }
    };

    const handleAcceptCall = async () => {
        const stream = await getUserMedia();
        setCallPopupVisible(false);
        setIsInCall(true);
        peerInstance.current.on('call', (call) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
            });
        });
        socket.emit('user-connected', { toUserId: calluserid, peerId: peerjsid });
    };

    const handleDeclineCall = () => {
        setCallPopupVisible(false);
        socket.emit('end-call', { toUserId: incomingCall.senderId });
    };

    const handleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const handleEndCall = () => {
        setIsInCall(false);
        if (peerInstance.current) {
            peerInstance.current.disconnect();
            peerInstance.current.destroy();
            removeCallTrack();
            socket.emit('end-call', { toUserId: incomingCall.senderId });
        }
    };

    const removeCallTrack = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    };
    const toggleVideoHide = () => {
        if (localStream) {
            const newIsVideoHidden = !isVideoHidden;
            localStream.getVideoTracks().forEach(track => (track.enabled = !newIsVideoHidden));
            setIsVideoHidden(newIsVideoHidden);
        }
    };
    return (
        <div className="flex h-screen bg-gray-900" > {/* style={{ 'height': '93vh' }} */}
            <div className="hidden md:block"> {/* Hidden on small screens, visible on medium and above */}
                <Sidebar setIsMenuOpen={setIsMenuOpen} />
            </div>
            {isMenuOpen && <Sidebar setIsMenuOpen={setIsMenuOpen} />}
            {!isMenuOpen && <ChatWindow setIsMenuOpen={setIsMenuOpen} />}

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

            {/* In-Call Popup */}
            {isInCall && (
                <div className="fixed inset-0 flex items-center justify-center z-50 flex-col md:flex-row" >
                    {callType !== 'video' && (<div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-4">In Call with {incomingCall?.senderName}</h2>
                        <img
                            src={incomingCall?.senderProfileImg}
                            alt="Caller"
                            className="w-20 h-20 rounded-full mx-auto mb-2"
                        />
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={handleMute}
                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                            >
                                {isMuted ? 'Unmute' : 'Mute'}
                            </button>
                            <button
                                onClick={handleEndCall}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                End Call
                            </button>
                        </div>
                    </div>)}

                    {/* Conditionally Render Audio or Video */}
                    {callType === 'video' ? (
                        <>
                            <div className="relative flex flex-col items-center">

                                <video
                                    ref={(video) => video && (video.srcObject = localStream)}
                                    autoPlay
                                    muted
                                    className="w-full max-w-md "
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <div className="absolute bottom-0 mb-4 flex space-x-4">
                                    <button
                                        onClick={handleMute}
                                        className={`${isMuted ? 'bg-gray-500' : 'bg-blue-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                                    >
                                        <FaMicrophone />
                                    </button>

                                    <button
                                        onClick={handleEndCall}
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
                        </>

                    ) : (
                        <audio
                            ref={(audio) => audio && (audio.srcObject = localStream)}
                            autoPlay
                            muted

                        ></audio>
                    )}

                    {callType === 'video' ? (
                        <video
                            ref={(video) => video && (video.srcObject = remoteStream)}
                            autoPlay
                            className="w-full max-w-md "
                            style={{ transform: 'scaleX(-1)', height: '28rem' }}
                        ></video>
                    ) : (
                        <audio
                            ref={(audio) => audio && (audio.srcObject = remoteStream)}
                            autoPlay
                        ></audio>
                    )}
                </div>
            )}
        </div>
    );
}

export default Test;
