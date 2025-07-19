# VideoChat

# Real-Time Video Meeting App (WebRTC + React + Socket.IO)

A real-time video meeting application that allows multiple participants to join a room using a **Room ID** and communicate via **WebRTC**, with **React + TypeScript** as the front-end and **Socket.IO + Node.js** as the signaling server.

---


## Overview
This project enables real-time video calls using **WebRTC**. A signaling server using **Socket.IO** facilitates session descriptions and ICE candidate exchanges between peers. It supports:
- Multiple participants (default max 6).
- Video/audio toggle.
- Screen sharing.
- Automatic room creation and deletion.

---

## Features
- **Room by ID:** First user auto-creates a room.
- **P2P Calls:** WebRTC-based peer connections.
- **Multi-user Mesh:** Every peer connects directly to every other peer.
- **Media Controls:** Toggle mic, camera, or switch to screen share.
- **Auto Cleanup:** Rooms deleted when last user leaves.
- **Responsive UI:** Built with TailwindCSS for modern, adaptive design.

---

## Tech Stack
- **Frontend:** React, TypeScript, TailwindCSS.
- **Backend:** Node.js, Express, Socket.IO.
- **WebRTC:** For real-time audio/video streams.
- **STUN Servers:** Google STUN (`stun:stun.l.google.com:19302`).

---

## Architecture
**Client (React + TypeScript)**
- `useWebRTC` hook handles WebRTC logic.
- `VideoRoom` component renders the meeting UI.
- `VideoStream` displays local and remote streams.

**Server (Node.js + Socket.IO)**
- Acts as a signaling server.
- Manages rooms and user connections.
- Relays offers, answers, and ICE candidates.

---




### 1. Clone the Repository
```bash
git clone https://github.com/your-username/video-meeting-app.git
cd video-meeting-app

