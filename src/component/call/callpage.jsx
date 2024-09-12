import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { useSocket } from '../context/socketContext';
import { FaMicrophone, FaPhoneSlash, FaVideoSlash } from 'react-icons/fa';
function CallPage() {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerInstance = useRef();
    const [peerjsid, setpeerid] = useState(null);
    const socket = useSocket();
    const [isInCall, setIsInCall] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [callType, setCallType] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const username = process.env.REACT_APP_METERED_USERNAME;
    const credential = process.env.REACT_APP_METERED_PASSWORD;
    useEffect(() => {
        const obj = JSON.parse(sessionStorage.getItem('currentCall'));
        console.log(obj);
        setCallType(obj.callType);
        setIncomingCall(obj.incomingCall);
        const peer = new Peer({
            config: {
                'iceserver': [
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
        peer.on('open', (id) => {
            console.log('my peer id', id);
            setpeerid(id);
            start(id);
        })
        peerInstance.current = peer;

        return () => {
            peer.disconnect();
            peer.destroy();
        };
    }, []);
    const getUserMedia = async (call) => {
        try {
            console.log('Getting user media', callType);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call == 'video' ? true : false });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error getting user media:', error);
        }
    };
    const start = async (id) => {
        const obj = JSON.parse(sessionStorage.getItem('currentCall'));
        console.log(obj);
        const stream = await getUserMedia(obj.callType);
        peerInstance.current.on('call', (call) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
            });
        });
        console.log(peerjsid);
        socket.emit('user-connected', { toUserId: obj.toUserId, peerId: id, senderId: obj.senderId });
    }
    const handleEndCall = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
        }
        setIsInCall(false);
        setRemoteStream(null);
        sessionStorage.removeItem('currentCall');
        socket.emit('end-call', { toUserId: incomingCall.senderId });
        window.close();
    };
    const handleMute = () => {
        localStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        });
    };
    const toggleVideoHide = () => {
        localStream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsVideoOn(!isVideoOn);
    };
    useEffect(() => {
        socket.on('end-call', (data) => {
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach((track) => track.stop());
            }
            setIsInCall(false);
            setRemoteStream(null);
            sessionStorage.removeItem('currentCall');
            window.close();
        });
        return () => {
            socket.off('call-ended');
            socket.off('call-accepted');
            socket.off('user-disconnected');
        };
    }, [socket, localStream]);
    return (
        <div >
            {isInCall && (
                <div className="fixed inset-0 flex items-center justify-center z-50 flex-col md:flex-row" style={{ background: 'black' }}>
                    {callType !== 'video' && (<div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-4">In Call with {incomingCall?.senderName}</h2>
                        <img
                            src={incomingCall?.senderProfileImg}
                            alt="Caller"
                            className="w-20 h-20 rounded-full mx-auto mb-2"
                        />
                        <p className="text-sm text-gray-500 mb-4">
                            {incomingCall?.senderName} is connected to the call.
                        </p>

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
                                        className={`${isMuted ? 'bg-gray-500' : 'bg-blue-500'}  text-white font-bold py-2 px-4 rounded`}
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
                                        className={`${isVideoOn ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-gray-700 text-white font-bold py-2 px-4 rounded`}
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

export default CallPage;
