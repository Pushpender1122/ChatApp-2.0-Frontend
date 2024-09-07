import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/socketContext';
import Peer from 'peerjs';

const VoiceCall = ({ user, chatUser, onClose }) => {
    const socket = useSocket();
    const [localStream, setLocalStream] = useState(null);
    const [showCallPopup, setShowCallPopup] = useState(false);
    const peerInstance = useRef(null);
    const [isCalling, setIsCalling] = useState(false); // Track if a call is ongoing
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false); // To track mute status

    useEffect(() => {
        const peer = new Peer({});
        peerInstance.current = peer; // Store peer instance

        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            // Notify the server about the voice call request
            socket.emit('voice_call', { toUserId: chatUser?.id, peerId: id, senderId: user?._id, senderName: user?.username, senderProfileImg: user?.profileimg });
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

        const handleVoiceCall = async () => {
            const stream = await getUserMedia();
            socket.on('user-connected', (data) => {
                const call = peer.call(data.peerId, stream); // Make the call
                setShowCallPopup(true); // Show the call popup UI
                console.log('Initiating call with peer:', data.peerId);
                call?.on('stream', (remoteStream) => {
                    console.log('Received remote stream:', remoteStream);
                    setRemoteStream(remoteStream);
                    setIsCalling(false); // Call is connected
                });
            });
        };

        handleVoiceCall();
        initiateCall();

        return () => {
            peer?.disconnect();
            peer?.destroy();
        };
    }, [chatUser, socket, user]);

    const initiateCall = () => {
        setIsCalling(true); // User clicks the call button
        setShowCallPopup(true); // Show popup
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
            setIsMuted(!isMuted);
        }
    };
    const handlecalldisconnect = () => {
        onClose(false)
        setShowCallPopup(false);
        peerInstance.current.disconnect();
        peerInstance.current.destroy();
        removeCallTrack();
        socket.emit('end-call', { toUserId: chatUser?.id });
    };
    const removeCallTrack = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            onClose(false)
        }
    }
    useEffect(() => {
        socket.on('end-call', () => {
            setShowCallPopup(false);
            peerInstance.current?.disconnect();
            peerInstance.current?.destroy();
            console.log('Call ended');
            console.log(localStream);
            removeCallTrack();
        });
    }, [localStream]);
    return (
        <div>
            <h1>Voice Call</h1>

            {/* Popup for call in the center of the screen */}
            {showCallPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center" style={{ 'background': 'rgb(31 41 55 / var(--tw-bg-opacity))' }}>
                        <img
                            src={chatUser?.profileimg || "https://via.placeholder.com/150"}
                            alt="User Avatar"
                            className="rounded-full w-24 h-24 mb-4"
                        />
                        <h2 className="text-lg font-bold mb-4">Calling {chatUser?.username}...</h2>

                        {isCalling ? (
                            <p>Connecting...</p>
                        ) : (
                            <p>Connected</p>
                        )}

                        {/* Mute and End Call Buttons */}
                        <div className="flex space-x-4 mt-4">
                            <button
                                onClick={toggleMute}
                                className={`${isMuted ? 'bg-gray-500' : 'bg-blue-500'
                                    } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
                            >
                                {isMuted ? 'Unmute' : 'Mute'}
                            </button>

                            <button
                                onClick={handlecalldisconnect} // Hide popup and end call
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                End Call
                            </button>
                        </div>
                    </div>

                    {/* Local audio stream */}
                    {localStream && (
                        <audio
                            ref={(audio) => audio && (audio.srcObject = localStream)}
                            autoPlay
                            muted // Mute local audio to avoid echo
                        ></audio>
                    )}

                    {/* Remote audio stream */}
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
};

export default VoiceCall;
