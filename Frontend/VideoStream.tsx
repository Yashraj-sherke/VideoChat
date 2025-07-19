import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from 'lucide-react';

interface VideoStreamProps {
  stream: MediaStream | null;
  isLocal: boolean;
  userName: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreen?: () => void;
  isScreenSharing?: boolean;
}

const VideoStream: React.FC<VideoStreamProps> = ({
  stream,
  isLocal,
  userName,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleScreen,
  isScreenSharing = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('📺 Setting video stream for', userName, ':', stream);
      
      videoRef.current.srcObject = stream;
      
      // Auto-play video
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          console.log('✅ Video playing for', userName);
        } catch (error) {
          console.log('⚠️ Video autoplay failed for', userName, '- user interaction may be required');
        }
      };
      
      if (videoRef.current.readyState >= 2) {
        playVideo();
      } else {
        videoRef.current.onloadeddata = playVideo;
      }
    }
  }, [stream, userName]);

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      
      {/* Video placeholder when video is disabled */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-sm opacity-75">Camera is off</p>
          </div>
        </div>
      )}

      {/* User name and status */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
            {userName} {isLocal && '(You)'}
          </span>
          <div className="flex items-center space-x-1">
            {!isAudioEnabled && (
              <div className="bg-red-500 p-1 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {!isVideoEnabled && (
              <div className="bg-red-500 p-1 rounded-full">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
            {isScreenSharing && (
              <div className="bg-blue-500 p-1 rounded-full">
                <Monitor className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Local controls */}
      {isLocal && (
        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-full transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={onToggleVideo}
            className={`p-2 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-4 h-4 text-white" />
            ) : (
              <VideoOff className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={onToggleScreen}
            className={`p-2 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-4 h-4 text-white" />
            ) : (
              <Monitor className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoStream;