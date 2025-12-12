# File Sharing - Network Discovery Setup

## Overview
This file sharing feature enables P2P file transfers between devices on the same network using WebRTC and Socket.IO signaling. **Devices automatically discover each other without requiring any manual room configuration.**

## How It Works

1. **Automatic Detection** - When you open the file sharing page, your device automatically registers itself on the network
2. **Live Discovery** - All other devices on the same network appear in the "Nearby Devices" list in real-time
3. **Direct Transfer** - Select a file and send it directly to any discovered device via WebRTC (P2P - no files pass through the server)

## Prerequisites
- Node.js installed on your system
- The signaling server must be running (handles device discovery and connection negotiation only)

## Running the Signaling Server

The signaling server enables devices to discover each other and establish connections.

### Steps:
1. Open a terminal/PowerShell
2. Navigate to the `server` directory:
   ```powershell
   cd c:\Users\Drumil\Desktop\portfolio\apple cinc\server
   ```

3. Install dependencies (if not already done):
   ```powershell
   npm install
   ```

4. Start the server:
   ```powershell
   npm start
   ```

You should see:
```
✓ Signaling server listening on http://192.168.56.1:3000
✓ Devices on 192.168.56.1 network will auto-discover each other
```

**Important:** Keep this terminal open. The server must continue running for device discovery to work.

## Using File Sharing

1. **Open the app** - Navigate to `client/index.html` in your browser
2. **Wait for connection** - The page will automatically connect to the signaling server
3. **See nearby devices** - All other devices on your network will appear under "Nearby Devices"
4. **Send a file**:
   - Click "Choose a file to send" and select a file
   - Click the "Send File" button next to a device
   - The receiving device gets a confirmation dialog
   - Accept to start the P2P transfer

## Troubleshooting

**No devices appearing in the list:**
- ✓ Make sure the signaling server is running (check terminal output)
- ✓ Verify all devices are on the same local network
- ✓ Check your firewall - port 3000 must be accessible on your network
- ✓ Try refreshing the page

**"Connection Failed" error:**
- ✓ The signaling server is not running
- ✓ Start it using the steps above in a separate terminal
- ✓ Make sure you're accessing from `localhost` or your local IP address

**File transfer fails:**
- ✓ Both devices must be on the same network
- ✓ Try sending a smaller file first
- ✓ Check browser console (F12) for detailed error messages

## Technical Details

### Architecture
- **Signaling Server** (`server/server.js`): Maintains device registry and facilitates WebRTC connection negotiation
- **WebRTC P2P**: Once connected, file transfer happens directly between browsers (files never touch the server)
- **Client** (`client/app.js`): Registers device, receives device list, manages transfers

### Network Discovery Flow
```
Device A                  Signaling Server              Device B
    |                            |                          |
    |----register-device---------|                          |
    |                            |----devices-update------->|
    |<----devices-update---------|                          |
    |                            |<----register-device------|
    |<----devices-update---------|                          |
```

### File Transfer (P2P)
```
Device A (Sender)              Device B (Receiver)
    |                                |
    |----------signal: offer-------->|
    |<---------signal: answer--------|
    |<-------ICE candidates--------->|
    |<<<<<< WebRTC DataChannel <<<<<<|
    |   (P2P file transfer)          |
```

## For Production Deployment

Update `client/app.js` line ~6:
```javascript
const SIGNALING_SERVER = 'https://your-domain.com:3000';
```

Deploy the server and ensure:
- HTTPS is enabled
- CORS is properly configured
- Port 3000 is accessible
- Consider adding TURN servers for devices behind restrictive NAT

---

**Server supports multiple concurrent transfers** - Multiple device pairs can exchange files simultaneously.

