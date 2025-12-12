// Minimal WebRTC file transfer using Socket.IO signaling
// Instructions: edit SIGNALING_SERVER to point to your server (http://localhost:3000)

const SIGNALING_SERVER = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://YOUR_DEPLOYED_SIGNALING_SERVER'; // update after deploy

import { io as ClientIO } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = ClientIO(SIGNALING_SERVER, { autoConnect: false });

const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const meEl = document.getElementById('me');
const peersList = document.getElementById('peersList');
const fileInput = document.getElementById('fileInput');
const fileMeta = document.getElementById('fileMeta');
const transferStatus = document.getElementById('transferStatus');
const transferProgress = document.getElementById('transferProgress');
const receivedFiles = document.getElementById('receivedFiles');

let localId = null;
let currentRoom = null;
let pc = null;              // RTCPeerConnection for active transfer
let dc = null;              // DataChannel for active transfer
let incomingBuffer = [];    // store incoming chunks
let incomingSize = 0;
let fileToSend = null;
const CHUNK_SIZE = 16 * 1024; // 16KB chunks

// UI handlers
joinBtn.addEventListener('click', () => {
  const room = (roomInput.value || '').trim();
  if (!room) return alert('Enter a room name (anything).');
  joinRoom(room);
});

// join room & connect socket
function joinRoom(room) {
  socket.connect();
  socket.on('connect', () => {
    localId = socket.id;
    meEl.textContent = `You: ${localId}`;
    socket.emit('join-room', room, { name: `Device ${localId.slice(0,6)}` });
    currentRoom = room;
    transferStatus.textContent = `Joined room: ${room}`;
  });

  socket.on('peers', peers => {
    renderPeers(peers);
  });

  socket.on('peer-joined', peer => {
    addPeerToList(peer);
  });

  socket.on('peer-left', ({ id }) => {
    removePeerFromList(id);
  });

  // relay signaling messages
  socket.on('signal', async ({ from, payload }) => {
    if (!payload) return;
    if (payload.type === 'offer') {
      // incoming offer -> create peer, set remote desc, create answer
      await handleIncomingOffer(from, payload);
    } else if (payload.type === 'answer') {
      await pc.setRemoteDescription(payload);
    } else if (payload.candidate) {
      try { await pc.addIceCandidate(payload); } catch(e){ console.warn('addIceCandidate err',e);}
    }
  });

  socket.on('connect_error', err => {
    console.error('signal connect error', err);
    alert('Unable to connect to signaling server.');
  });

  // handle disconnect cleanup
  socket.on('disconnect', () => {
    currentRoom = null;
    meEl.textContent = 'Not connected';
    peersList.innerHTML = '';
  });
}

// Render initial list
function renderPeers(peers) {
  peersList.innerHTML = '';
  peers.forEach(addPeerToList);
}

function addPeerToList(peer) {
  const li = document.createElement('li');
  li.className = 'peer-item';
  li.id = `peer-${peer.id}`;
  const name = (peer.meta && peer.meta.name) ? peer.meta.name : peer.id;
  li.innerHTML = `<span title="${peer.id}">${name}</span>`;
  const btn = document.createElement('button');
  btn.textContent = 'Send';
  btn.addEventListener('click', () => {
    if (!fileToSend) return alert('Pick a file first.');
    startConnectionAsCaller(peer.id);
  });
  li.appendChild(btn);
  peersList.appendChild(li);
}

function removePeerFromList(id) {
  const el = document.getElementById(`peer-${id}`);
  if (el) el.remove();
}

// file selection
fileInput.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) { fileToSend = null; fileMeta.textContent = ''; return; }
  fileToSend = f;
  fileMeta.textContent = `${f.name} — ${Math.round(f.size/1024)} KB`;
});

// --------- WebRTC / Signaling flow (caller) ----------
async function startConnectionAsCaller(remoteId) {
  setupPeerConnection(remoteId, true);
  // create datachannel
  dc = pc.createDataChannel('file');
  setupDataChannel(dc, true);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  // send offer via signaling
  socket.emit('signal', { to: remoteId, payload: pc.localDescription });
  transferStatus.textContent = `Offering to ${remoteId}...`;
}

// --------- Handle incoming offer (callee) ----------
async function handleIncomingOffer(fromId, offer) {
  // Ask user to accept
  const accept = confirm(`Device ${fromId} wants to send a file. Accept?`);
  if (!accept) {
    // Optionally respond with reject signal (not implemented), or just ignore
    return;
  }

  setupPeerConnection(fromId, false);

  pc.ondatachannel = (ev) => {
    dc = ev.channel;
    setupDataChannel(dc, false);
  };

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('signal', { to: fromId, payload: pc.localDescription });
  transferStatus.textContent = `Connected; receiving from ${fromId}...`;
}

// common peer setup
function setupPeerConnection(remoteId, isCaller) {
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // For production add TURN server here:
      // { urls: 'turn:YOUR_TURN_SERVER', username: 'user', credential: 'pass' }
    ]
  });

  // ICE -> send to remote
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('signal', { to: remoteId, payload: e.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('pc state', pc.connectionState);
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      cleanupConnection();
    }
  };
}

// DataChannel logic
function setupDataChannel(channel, isSender) {
  channel.binaryType = 'arraybuffer';
  channel.onopen = () => {
    console.log('dc open', channel);
    transferStatus.textContent = isSender ? 'Data channel open — sending...' : 'Data channel open — ready to receive';
    if (isSender) sendFileOverDataChannel(channel, fileToSend);
  };

  channel.onclose = () => {
    transferStatus.textContent = 'Data channel closed';
  };

  channel.onmessage = (ev) => {
    // Receiving controls and file chunks
    if (typeof ev.data === 'string') {
      // control messages are JSON strings
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'meta') {
          // incoming file metadata
          incomingBuffer = [];
          incomingSize = 0;
          transferStatus.textContent = `Receiving: ${msg.name} (${Math.round(msg.size/1024)} KB)`;
          transferProgress.value = 0;
          transferProgress.max = msg.size;
        }
      } catch (e) {
        console.warn('non-json text', ev.data);
      }
      return;
    }

    // binary chunk
    const chunk = ev.data;
    incomingBuffer.push(chunk);
    incomingSize += chunk.byteLength;
    transferProgress.value = Math.min(incomingSize, transferProgress.max);
    const percent = Math.round((incomingSize / transferProgress.max) * 100);
    transferStatus.textContent = `Receiving... ${percent}%`;

    // If received all
    if (incomingSize >= transferProgress.max) {
      const received = new Blob(incomingBuffer);
      const url = URL.createObjectURL(received);
      const a = document.createElement('a');
      a.href = url;
      a.download = `received-${Date.now()}`;
      a.textContent = `Download received file (${Math.round(incomingSize/1024)} KB)`;
      receivedFiles.appendChild(a);
      transferStatus.textContent = 'Receive complete';
      // cleanup
      incomingBuffer = [];
      incomingSize = 0;
      transferProgress.value = 0;
    }
  };
}

// sending file: send metadata first, then chunked binary
async function sendFileOverDataChannel(channel, file) {
  if (!file) return;
  // send metadata
  channel.send(JSON.stringify({ type: 'meta', name: file.name, size: file.size }));
  const stream = file.stream ? file.stream() : null;

  // Browser with stream support (modern) -> use reader
  if (stream && stream.getReader) {
    const reader = stream.getReader();
    let sent = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      channel.send(value.buffer || value);
      sent += (value.byteLength || value.length);
      transferProgress.value = Math.min(sent, file.size);
      transferStatus.textContent = `Sending... ${Math.round((sent/file.size)*100)}%`;
      await waitForBufferLow(channel);
    }
  } else {
    // fallback: slice blobs
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const arrayBuffer = await chunk.arrayBuffer();
      channel.send(arrayBuffer);
      offset += arrayBuffer.byteLength;
      transferProgress.value = Math.min(offset, file.size);
      transferStatus.textContent = `Sending... ${Math.round((offset/file.size)*100)}%`;
      await waitForBufferLow(channel);
    }
  }
  transferStatus.textContent = 'Send complete';
  // optionally close channel/pc
  setTimeout(() => {
    channel.close();
    pc.close();
  }, 1000);
}

// manage datachannel bufferedAmount to avoid overrun
function waitForBufferLow(channel) {
  return new Promise(resolve => {
    const maxBuffered = 16 * CHUNK_SIZE; // allow some buffered amount
    if (channel.bufferedAmount <= maxBuffered) return resolve();
    const check = () => {
      if (channel.bufferedAmount <= maxBuffered) {
        channel.removeEventListener('bufferedamountlow', check);
        resolve();
      }
    };
    channel.addEventListener('bufferedamountlow', check);
    // set lowThreshold to half chunk maybe
    try { channel.bufferedAmountLowThreshold = CHUNK_SIZE; } catch {}
    // fallback timeout
    setTimeout(resolve, 3000);
  });
}

function cleanupConnection() {
  if (dc && dc.readyState !== 'closed') try { dc.close(); } catch {}
  if (pc && pc.connectionState !== 'closed') try { pc.close(); } catch {}
  pc = null; dc = null;
  transferStatus.textContent = 'No active transfer';
  transferProgress.value = 0;
}
