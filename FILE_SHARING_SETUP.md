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

### Important: HTTPS and Mixed-Content

- If you serve your site over HTTPS (recommended), the signaling server must also be accessible over HTTPS (wss for sockets). Browsers block mixed content (https page connecting to ws:// or http://), which causes "Connection Failed".
- Options to avoid mixed-content errors:
   - Run the signaling server behind the same domain and port via a reverse proxy (NGINX/Apache) so `location.origin` works (recommended).
   - Provision TLS for the signaling server and use its HTTPS URL (e.g. `https://signal.example.com`). Then set the SIGNALING_SERVER to that HTTPS URL or visit the client with `?signal=https://signal.example.com`.
   - Use a reverse proxy such as NGINX to expose your Node server securely at `https://your-domain.com` and proxy requests to the Node process on port 3000.

### Quick NGINX reverse-proxy example
Place this on your server (adjust paths and server names):

```nginx
server {
   listen 80;
   server_name your-domain.com;
   return 301 https://$host$request_uri;
}

server {
   listen 443 ssl;
   server_name your-domain.com;
   ssl_certificate /path/to/fullchain.pem;
   ssl_certificate_key /path/to/privkey.pem;

   location / {
      proxy_pass http://127.0.0.1:3000; # Node signaling server
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
   }
}
```

After this, the client can use `location.origin` as the signaling server (no extra config). If your site is on a different host than the signaling server, start the client with `?signal=https://signal.your-domain.com` to override.

## Optimize Hero Image for Faster Loading

For best performance serve responsive WebP images and fallbacks so browsers download the smallest appropriate file. Below are example sizes and commands to create optimized variants from your source `timncocard.png`.

Recommended output filenames (place alongside `timncocard.png` in the repo):
- `timncocard-320.webp`, `timncocard-320.jpg`
- `timncocard-720.webp`, `timncocard-720.jpg`
- `timncocard-1200.webp`, `timncocard-1200.jpg`
- `timncocard-2000.webp`, `timncocard-2000.jpg`

Windows PowerShell + ImageMagick example:

```powershell
$sizes = 320,720,1200,2000
foreach ($s in $sizes) {
   magick convert timncocard.png -strip -resize ${s}x -quality 80 timncocard-$s.jpg
   magick timncocard-$s.jpg timncocard-$s.webp
}
```

Using `sharp` (Node.js) for the same (recommended for build pipelines):

```bash
npx sharp timncocard.png -resize 320 -quality 80 timncocard-320.webp
npx sharp timncocard.png -resize 720 -quality 80 timncocard-720.webp
npx sharp timncocard.png -resize 1200 -quality 80 timncocard-1200.webp
npx sharp timncocard.png -resize 2000 -quality 80 timncocard-2000.webp

# Create JPEG fallbacks if you need them
npx sharp timncocard.png -resize 720 -quality 80 timncocard-720.jpg
```

Notes:
- Prefer WebP for modern browsers — it provides significantly smaller files at equal quality.
- Keep the hero `img` loading priority high (we already set `loading="eager"` and `fetchpriority="high"`).
- Consider preloading the most-likely hero image for your audience (e.g., 720w) in the HTML head:

```html
<link rel="preload" as="image" href="/client/timncocard-720.webp" imagesrcset="/client/timncocard-720.webp 720w, /client/timncocard-1200.webp 1200w" imagesizes="(max-width:980px) 720px, 1200px">
```

- If you use a build pipeline, generate these files automatically and update the `srcset` entries in `index.html` accordingly.

---

**Server supports multiple concurrent transfers** - Multiple device pairs can exchange files simultaneously.

