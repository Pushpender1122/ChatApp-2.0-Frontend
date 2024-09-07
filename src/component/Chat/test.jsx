import React, { useEffect, useContext, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useSocket } from '../context/socketContext';
import { UserContext } from '../context/user';
import Peer from 'peerjs';

function Test() {
    const socket = useSocket();
    const { user } = useContext(UserContext);
    const peerInstance = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null); // Manage incoming call state
    const [isCallPopupVisible, setCallPopupVisible] = useState(false); // Popup visibility state
    const [isInCall, setIsInCall] = useState(false); // Manage in-call state
    const [isMuted, setIsMuted] = useState(false); // Mute state
    const [calluserid, setCallUserId] = useState(null);
    const [peerjsid, setPeerjsId] = useState(null);

    useEffect(() => {
        // Register the user and handle friend request
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
        // Handle incoming voice calls
        socket.on('voice_call', (data) => {
            console.log('Incoming voice call:', data);
            setIncomingCall(data); // Store the incoming call data
            setCallPopupVisible(true); // Show the call popup

            const peer = new Peer({});
            peerInstance.current = peer;

            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                const conn = peer.connect(data.peerId);

                conn.on('open', () => {
                    conn.send('hi!');
                });
                conn.on('data', (data) => {
                    console.log('Data received from peer:', data);
                });
                setCallUserId(data.senderId);
                setPeerjsId(id);

            });

            const getUserMedia = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(stream);
                    return stream;
                } catch (error) {
                    console.error('Error getting user media:', error);
                }
            };

            const handleAnswerCall = async () => {
                const stream = await getUserMedia();
                peer.on('call', (call) => {
                    call.answer(stream); // Answer the call with the local audio stream
                    console.log('Call answered:', call);

                    call.on('stream', (remoteStream) => {
                        console.log('Received remote stream:', remoteStream);
                        setRemoteStream(remoteStream);
                    });
                });
            };
            // handleAnswerCall();
        });
        return () => {
            if (socket) {
                socket.off('voice_call');
            }
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error getting user media:', error);
        }
    };

    const handleAcceptCall = async () => {
        const stream = await getUserMedia();
        setCallPopupVisible(false); // Hide the incoming call popup
        setIsInCall(true); // Show the in-call popup
        peerInstance.current.on('call', (call) => {
            console.log('testing call:', call);
            call.answer(stream); // Answer the call with the local audio stream
            console.log('Call answered:', call);

            call.on('stream', (remoteStream) => {
                console.log('Received remote stream:', remoteStream);
                setRemoteStream(remoteStream);
            });
        });
        socket.emit('user-connected', { toUserId: calluserid, peerId: peerjsid });
    };

    const handleDeclineCall = () => {
        setCallPopupVisible(false);
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
        console.log('removeCallTrack', localStream, remoteStream);
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    }
    return (
        <div className="flex h-screen bg-gray-900">
            <Sidebar />
            <ChatWindow />

            {/* Incoming Call Popup */}
            {isCallPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-4">Incoming Call</h2>
                        <img
                            src={incomingCall?.senderProfileImg} // Display caller's image
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
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-lg font-bold mb-4">In Call with {incomingCall?.senderName}</h2>
                        <img
                            src={incomingCall?.senderProfileImg} // Display caller's image
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
                    </div>
                    {localStream && (
                        <audio
                            ref={(audio) => audio && (audio.srcObject = localStream)}
                            autoPlay
                            muted // Mute local audio to avoid echo
                        ></audio>
                    )}
                    {remoteStream && (
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
