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

## Project Demostration

## Project Front Page
<img width="1896" height="910" alt="Screenshot 2025-08-20 182539" src="https://github.com/user-attachments/assets/5dd2cb64-8cd4-41ed-86ed-7dac8025be0e" />


## Meeting Room
<img width="1913" height="907" alt="image" src="https://github.com/user-attachments/assets/05c1cc18-a25d-4a9f-8e63-55e90f8a1db7" />

---





### 1. Clone the Repository
```bash
git clone https://github.com/your-username/video-meeting-app.git
cd video-meeting-app

