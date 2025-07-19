import React, { useState } from 'react';
import { Video, Users, Copy, Check } from 'lucide-react';

interface RoomLobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  isLoading: boolean;
  initialRoomId?: string;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ onCreateRoom, onJoinRoom, isLoading, initialRoomId = '' }) => {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) {
      onJoinRoom(roomId.trim(), userName.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-full p-6 w-20 h-20 mx-auto mb-4">
            <Video className="w-8 h-8 text-white mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VideoChat</h1>
          <p className="text-white text-opacity-70">
            Connect with anyone, anywhere in real-time
          </p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
          {/* Media Permission Check */}
          <div className="mb-6 p-4 bg-yellow-500 bg-opacity-20 rounded-xl border border-yellow-400 border-opacity-30">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-400 text-xl">⚠️</div>
              <div>
                <p className="text-yellow-200 text-sm font-medium mb-1">
                  Camera & Microphone Required
                </p>
                <p className="text-yellow-200 text-xs opacity-90">
                  Please allow camera and microphone access when prompted. 
                  If blocked, click the camera icon in your browser's address bar to enable.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Create Room */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Start a Meeting
              </h2>
              <button
                onClick={onCreateRoom}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Room...' : 'Create New Room'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white border-opacity-20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-4 text-white text-opacity-70">
                  or
                </span>
              </div>
            </div>

            {/* Join Room */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Join a Meeting</h2>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !roomId.trim() || !userName.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Room ID Display for Created Room */}
        {window.location.hash.includes('room=') && (
          <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4">
            <p className="text-white text-sm mb-2">Share this room ID:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-black bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm font-mono">
                {window.location.hash.split('room=')[1]}
              </code>
              <button
                onClick={() => copyToClipboard(window.location.hash.split('room=')[1])}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;