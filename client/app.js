// WebRTC file transfer with automatic network discovery
// Devices on the same network automatically discover each other

// SIGNALING_SERVER selection logic:
// - You can override the signaling server by adding ?signal=https://your-signaling.example to the page URL
// - If running on localhost, use the local server at http://localhost:3000
// - Otherwise default to the current site origin (works if you proxy the signaling server behind the same domain)
const SIGNALING_SERVER = (() => {
  try {
    const q = new URLSearchParams(location.search).get('signal');
    if (q) return q;
  } catch (e) {
    // ignore
  }

  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // Default to same origin. If your signaling server is on a separate host/port, provide it via ?signal=...
  return `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}`;
})();

import { io as ClientIO } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = ClientIO(SIGNALING_SERVER, { 
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

const meEl = document.getElementById('me');
const peersList = document.getElementById('peersList');
const fileInput = document.getElementById('fileInput');
const fileMeta = document.getElementById('fileMeta');
const transferStatus = document.getElementById('transferStatus');
const transferProgress = document.getElementById('transferProgress');
const receivedFiles = document.getElementById('receivedFiles');

let localId = null;
let deviceName = `Device ${Math.random().toString(36).substr(2, 9)}`;
let pc = null;              // RTCPeerConnection for active transfer
let dc = null;              // DataChannel for active transfer
let incomingBuffer = [];    // store incoming chunks
let incomingSize = 0;
let fileToSend = null;
const CHUNK_SIZE = 16 * 1024; // 16KB chunks

// Auto-connect on page load
window.addEventListener('load', () => {
  connectToNetwork();
});

// Connect to network and discover nearby devices
function connectToNetwork() {
  socket.connect();
  
  socket.on('connect', () => {
    localId = socket.id;
    meEl.textContent = `✓ Connected as: ${deviceName}`;
    
    // Register this device on the network
    socket.emit('register-device', {
      name: deviceName,
      id: localId,
      timestamp: Date.now()
    });
    
    // Request current device list
    socket.emit('get-devices');
    
    transferStatus.textContent = 'Connected to network - discovering nearby devices...';
  });

  // Handle device list updates
  socket.on('devices-update', (devices) => {
    renderDevices(devices);
  });

  // Handle incoming connection offers
  socket.on('signal', async ({ from, payload }) => {
    if (!payload) return;
    if (payload.type === 'offer') {
      await handleIncomingOffer(from, payload);
    } else if (payload.type === 'answer') {
      await pc.setRemoteDescription(payload);
    } else if (payload.candidate) {
      try { await pc.addIceCandidate(payload); } catch(e){ console.warn('ICE candidate error', e); }
    }
  });

  socket.on('connect_error', err => {
    console.error('Connection error:', err);
    meEl.textContent = '❌ Connection Failed';
    transferStatus.textContent = `Cannot connect to signaling server at ${SIGNALING_SERVER}. Make sure the server is running.`;
  });

  socket.on('disconnect', () => {
    meEl.textContent = 'Not connected';
    peersList.innerHTML = '';
    transferStatus.textContent = 'Disconnected from network';
  });
}

// Render list of nearby devices
function renderDevices(devices) {
  peersList.innerHTML = '';
  
  if (devices.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'No other devices on this network yet.';
    peersList.appendChild(emptyMsg);
    transferStatus.textContent = 'Connected - waiting for other devices...';
    return;
  }
  
  transferStatus.textContent = `Found ${devices.length} device${devices.length !== 1 ? 's' : ''} on network`;
  devices.forEach(addDeviceToList);
}

function addDeviceToList(device) {
  const li = document.createElement('li');
  li.className = 'peer-item';
  li.id = `device-${device.id}`;
  
  const name = device.name || `Device ${device.id.slice(0, 6)}`;
  li.innerHTML = `<span title="${device.id}">📱 ${name}</span>`;
  
  const btn = document.createElement('button');
  btn.textContent = 'Send File';
  btn.addEventListener('click', () => {
    if (!fileToSend) return alert('Please select a file first.');
    startConnectionAsCaller(device.id, name);
  });
  
  li.appendChild(btn);
  peersList.appendChild(li);
}

// File selection
fileInput.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) { 
    fileToSend = null; 
    fileMeta.textContent = ''; 
    return; 
  }
  fileToSend = f;
  fileMeta.textContent = `📄 ${f.name} — ${Math.round(f.size/1024)} KB`;
});

// --------- WebRTC Connection Flow (Caller) ----------
async function startConnectionAsCaller(remoteId, remoteName) {
  setupPeerConnection(remoteId, true);
  
  dc = pc.createDataChannel('file');
  setupDataChannel(dc, true);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('signal', { to: remoteId, payload: pc.localDescription });
  
  transferStatus.textContent = `Sending file to ${remoteName}...`;
}

// --------- Handle Incoming Offer (Callee) ----------
async function handleIncomingOffer(fromId, offer) {
  const accept = confirm(`Device wants to send you a file. Accept?`);
  if (!accept) return;

  setupPeerConnection(fromId, false);

  pc.ondatachannel = (ev) => {
    dc = ev.channel;
    setupDataChannel(dc, false);
  };

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('signal', { to: fromId, payload: pc.localDescription });
  
  transferStatus.textContent = 'Connected - receiving file...';
}

// --------- Common Peer Connection Setup ----------
function setupPeerConnection(remoteId, isCaller) {
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('signal', { to: remoteId, payload: e.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      cleanupConnection();
    }
  };
}

// --------- DataChannel Logic ----------
function setupDataChannel(channel, isSender) {
  channel.binaryType = 'arraybuffer';
  
  channel.onopen = () => {
    console.log('DataChannel opened');
    if (isSender) {
      transferStatus.textContent = 'Sending file...';
      sendFileOverDataChannel(channel, fileToSend);
    } else {
      transferStatus.textContent = 'Ready to receive file...';
    }
  };

  channel.onclose = () => {
    transferStatus.textContent = 'Transfer complete';
  };

  channel.onmessage = (ev) => {
    if (typeof ev.data === 'string') {
      // Control messages (metadata)
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'meta') {
          incomingBuffer = [];
          incomingSize = 0;
          transferStatus.textContent = `Receiving: ${msg.name}`;
          transferProgress.value = 0;
          transferProgress.max = msg.size;
        }
      } catch (e) {
        console.warn('Parse error:', e);
      }
      return;
    }

    // Binary file chunk
    const chunk = ev.data;
    incomingBuffer.push(chunk);
    incomingSize += chunk.byteLength;
    transferProgress.value = Math.min(incomingSize, transferProgress.max);
    
    const percent = Math.round((incomingSize / transferProgress.max) * 100);
    transferStatus.textContent = `Receiving... ${percent}%`;

    if (incomingSize >= transferProgress.max) {
      completeFileTransfer();
    }
  };
}

// Complete file transfer and prepare download
function completeFileTransfer() {
  const received = new Blob(incomingBuffer);
  const url = URL.createObjectURL(received);
  const a = document.createElement('a');
  a.href = url;
  a.download = `received-${Date.now()}`;
  a.textContent = `📥 Download (${Math.round(incomingSize/1024)} KB)`;
  a.className = 'download-link';
  receivedFiles.appendChild(a);
  
  transferStatus.textContent = 'File received! Click to download.';
  incomingBuffer = [];
  incomingSize = 0;
  transferProgress.value = 0;
}

// Send file over DataChannel
async function sendFileOverDataChannel(channel, file) {
  if (!file) return;
  
  // Send metadata
  channel.send(JSON.stringify({ 
    type: 'meta', 
    name: file.name, 
    size: file.size 
  }));

  const stream = file.stream ? file.stream() : null;

  if (stream && stream.getReader) {
    // Modern stream-based approach
    const reader = stream.getReader();
    let sent = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      channel.send(value.buffer || value);
      sent += (value.byteLength || value.length);
      updateSendProgress(sent, file.size);
      await waitForBufferLow(channel);
    }
  } else {
    // Fallback: slice blobs
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const arrayBuffer = await chunk.arrayBuffer();
      channel.send(arrayBuffer);
      offset += arrayBuffer.byteLength;
      updateSendProgress(offset, file.size);
      await waitForBufferLow(channel);
    }
  }
  
  transferStatus.textContent = 'Send complete';
  setTimeout(() => {
    try { 
      channel.close(); 
      pc.close(); 
    } catch(e) { console.log('Cleanup error:', e); }
  }, 1000);
}

function updateSendProgress(sent, total) {
  transferProgress.value = Math.min(sent, total);
  const percent = Math.round((sent / total) * 100);
  transferStatus.textContent = `Sending... ${percent}%`;
}

// Wait for DataChannel buffer to clear
function waitForBufferLow(channel) {
  return new Promise(resolve => {
    const maxBuffered = 16 * CHUNK_SIZE;
    if (channel.bufferedAmount <= maxBuffered) return resolve();
    
    const check = () => {
      if (channel.bufferedAmount <= maxBuffered) {
        channel.removeEventListener('bufferedamountlow', check);
        resolve();
      }
    };
    
    channel.addEventListener('bufferedamountlow', check);
    try { channel.bufferedAmountLowThreshold = CHUNK_SIZE; } catch {}
    setTimeout(resolve, 3000);
  });
}

function cleanupConnection() {
  if (dc && dc.readyState !== 'closed') try { dc.close(); } catch {}
  if (pc && pc.connectionState !== 'closed') try { pc.close(); } catch {}
  pc = null; 
  dc = null;
  transferStatus.textContent = 'Connection closed';
  transferProgress.value = 0;
}
