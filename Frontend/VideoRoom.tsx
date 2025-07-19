import React from 'react';
import { Phone, Copy, Check, Users, Wifi, WifiOff } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoStream from './VideoStream';

interface VideoRoomProps {
  roomId: string;
  userName: string;
  shouldCreateNewRoom?: boolean;
  onRoomIdCreated?: (roomId: string) => void;
  onLeaveRoom: () => void;
  onLeaveRoomWithError: (error: string) => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({
  roomId,
  userName,
  shouldCreateNewRoom = false,
  onRoomIdCreated,
  onLeaveRoom,
  onLeaveRoomWithError
}) => {
  const [copied, setCopied] = React.useState(false);

  const {
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
  } = useWebRTC({
    roomId,
    userName,
    shouldCreateNewRoom,
    onRoomIdCreated,
    onLeaveRoom,
    onLeaveRoomWithError
  });

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    const shareUrl = `${window.location.origin}/#room=${roomId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my video call',
        text: 'Join me for a video call!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show loading state while room is being created
  if (!roomId && shouldCreateNewRoom) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Creating Room...</h2>
          <p className="text-gray-400">Please wait while we set up your video room</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">VideoChat</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className="text-sm text-gray-300">{connectionStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Room Info */}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{users.length} participant{users.length !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Room ID */}
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-300">Room:</span>
              <code className="text-sm font-mono text-white">{roomId}</code>
              <button
                onClick={copyRoomId}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title="Copy room ID"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={shareRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Share Room
            </button>

            {/* Leave Button */}
            <button
              onClick={onLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              title="Leave room"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto h-full">
          {remoteStream ? (
            /* Two-person call layout */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Remote video */}
              <div className="relative">
                <VideoStream
                  stream={remoteStream}
                  isLocal={false}
                  userName={users.find(u => u.id !== 'local')?.name || 'Remote User'}
                  isAudioEnabled={true}
                  isVideoEnabled={true}
                />
              </div>
              
              {/* Local video */}
              <div className="relative">
                <VideoStream
                  stream={localStream}
                  isLocal={true}
                  userName={userName}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  isScreenSharing={isScreenSharing}
                  onToggleAudio={toggleAudio}
                  onToggleVideo={toggleVideo}
                  onToggleScreen={toggleScreenShare}
                />
              </div>
            </div>
          ) : (
            /* Waiting for others layout */
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {/* Local video preview */}
              <div className="w-full max-w-md">
                <VideoStream
                  stream={localStream}
                  isLocal={true}
                  userName={userName}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  isScreenSharing={isScreenSharing}
                  onToggleAudio={toggleAudio}
                  onToggleVideo={toggleVideo}
                  onToggleScreen={toggleScreenShare}
                />
              </div>

              {/* Waiting message */}
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <Users className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Waiting for others to join...
                </h2>
                <p className="text-gray-400 mb-4">
                  Share the room ID or link with others to start the call
                </p>
                
                {/* Share options */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={copyRoomId}
                    className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Room ID'}</span>
                  </button>
                  
                  <button
                    onClick={shareRoom}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Share Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed bottom-4 left-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">{connectionStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRoom;