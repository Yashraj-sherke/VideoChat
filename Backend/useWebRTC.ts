import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  joinedAt: Date;
}

interface UseWebRTCProps {
  roomId: string;
  userName: string;
  shouldCreateNewRoom?: boolean;
  onRoomIdCreated?: (roomId: string) => void;
  onLeaveRoom: () => void;
  onLeaveRoomWithError: (error: string) => void;
}

export const useWebRTC = ({
  roomId,
  userName,
  shouldCreateNewRoom = false,
  onRoomIdCreated,
  onLeaveRoom,
  onLeaveRoomWithError
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const initializationRef = useRef<boolean>(false);
  const currentRoomIdRef = useRef<string>('');

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      console.log('🎥 Initializing media stream...');
      setConnectionStatus('Getting camera access...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained');

      setLocalStream(stream);
      localStreamRef.current = stream;
      setConnectionStatus('Media ready');
      
      return stream;
    } catch (error) {
      console.error('❌ Failed to get media stream:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        onLeaveRoomWithError('Camera access denied. Please allow camera permissions and try again.');
      } else if (errorMessage.includes('NotFoundError')) {
        onLeaveRoomWithError('No camera found. Please connect a camera and try again.');
      } else {
        onLeaveRoomWithError(`Media access failed: ${errorMessage}`);
      }
      
      throw error;
    }
  }, [onLeaveRoomWithError]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Socket already connected, reusing...');
      return socketRef.current;
    }

    console.log('🔌 Creating new socket connection...');
    setConnectionStatus('Connecting to server...');
    
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnectionStatus('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus('Connection failed');
      onLeaveRoomWithError('Failed to connect to server. Please try again.');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      onLeaveRoomWithError(error.message || 'Connection error occurred');
    });

    socket.on('room-joined', ({ roomId: joinedRoomId, users: roomUsers, isInitiator }) => {
      console.log('✅ Room joined successfully:', { joinedRoomId, roomUsers, isInitiator });
      currentRoomIdRef.current = joinedRoomId;
      setUsers(roomUsers);
      setIsConnected(true);
      setConnectionStatus('Connected to room');
    });

    socket.on('user-joined', ({ userId, userName: newUserName, usersCount }) => {
      console.log('👤 User joined:', { userId, userName: newUserName, usersCount });
      setConnectionStatus(`${newUserName} joined the call`);
      
      // Initiate connection to new user
      setTimeout(() => {
        if (peerConnectionRef.current && localStreamRef.current) {
          createOffer(userId);
        }
      }, 1000);
    });

    socket.on('user-left', ({ userId, userName: leftUserName }) => {
      console.log('👋 User left:', { userId, userName: leftUserName });
      setConnectionStatus('Other participant left');
      setRemoteStream(null);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // WebRTC signaling
    socket.on('offer', async ({ offer, senderId }) => {
      console.log('📨 Received offer from:', senderId);
      await handleOffer(offer, senderId);
    });

    socket.on('answer', async ({ answer, senderId }) => {
      console.log('📨 Received answer from:', senderId);
      await handleAnswer(answer);
    });

    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      console.log('🧊 Received ICE candidate from:', senderId);
      await handleIceCandidate(candidate);
    });

    socketRef.current = socket;
    return socket;
  }, [onLeaveRoomWithError]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    console.log('🔗 Creating peer connection...');
    
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: 'broadcast'
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind);
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      setConnectionStatus('Video call active');
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Peer connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setConnectionStatus('Video call connected');
      } else if (peerConnection.connectionState === 'disconnected') {
        setConnectionStatus('Call disconnected');
      }
    };

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('➕ Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, []);

  // Create and send offer
  const createOffer = useCallback(async (targetUserId: string) => {
    try {
      console.log('📤 Creating offer for user:', targetUserId);
      
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit('offer', {
          offer,
          targetId: targetUserId
        });
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, senderId: string) => {
    try {
      console.log('📥 Handling offer from:', senderId);
      
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      await peerConnectionRef.current!.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('answer', {
          answer,
          targetId: senderId
        });
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('📥 Handling answer');
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  }, []);

  // Create room
  const createRoom = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log('🏗️ Creating new room...');
    setConnectionStatus('Creating room...');
    
    socket.emit('create-room', ({ roomId: newRoomId }: { roomId: string }) => {
      console.log('✅ Room created:', newRoomId);
      currentRoomIdRef.current = newRoomId;
      onRoomIdCreated?.(newRoomId);
    });
  }, [onRoomIdCreated]);

  // Join room
  const joinRoom = useCallback(async (targetRoomId: string) => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log('🚪 Joining room:', targetRoomId);
    setConnectionStatus('Joining room...');
    
    socket.emit('join-room', { 
      roomId: targetRoomId, 
      userName 
    });
  }, [userName]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [isVideoEnabled]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        console.log('🖥️ Starting screen share...');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Replace video track in peer connection
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }

        setIsScreenSharing(true);

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('🖥️ Screen share ended');
          setIsScreenSharing(false);
          initializeMedia();
        };
      } else {
        console.log('🖥️ Stopping screen share...');
        setIsScreenSharing(false);
        await initializeMedia();
      }
    } catch (error) {
      console.error('❌ Screen share error:', error);
    }
  }, [isScreenSharing, initializeMedia]);

  // Initialize everything
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initialize = async () => {
      try {
        console.log('🚀 Initializing WebRTC...');
        
        // Initialize media first
        await initializeMedia();
        
        // Initialize socket
        initializeSocket();
        
        // Wait for socket connection then proceed
        setTimeout(() => {
          if (shouldCreateNewRoom) {
            createRoom();
          } else if (roomId) {
            joinRoom(roomId);
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
      }
    };

    initialize();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebRTC...');
      
      initializationRef.current = false;
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle room joining when roomId changes (for manual joins)
  useEffect(() => {
    if (roomId && !shouldCreateNewRoom && socketRef.current?.connected && !isConnected) {
      console.log('🔄 Room ID changed, joining new room:', roomId);
      joinRoom(roomId);
    }
  }, [roomId, shouldCreateNewRoom, isConnected, joinRoom]);

  return {
    localStream,
    remoteStream,
    isConnected,
    users,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionStatus,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};