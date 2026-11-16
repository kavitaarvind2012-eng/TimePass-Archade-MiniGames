/**
 * TimePass Arcade - NetworkManager
 * Dual-mode networking: BroadcastChannel (local cross-tab) + WebRTC DataChannel (P2P)
 * Clean abstraction with Socket.io-ready adapter interface.
 */
class NetworkManager {
  constructor() {
    this.roomCode = null;
    this.isHost = false;
    this.connected = false;
    this.mode = 'broadcast'; // 'broadcast' | 'webrtc' | 'socketio'
    this.channel = null;
    this.signalingChannel = null;
    this.pc = null; // RTCPeerConnection
    this.dc = null; // RTCDataChannel
    this.onReceiveCallbacks = [];
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.pollInterval = null;
  }

  // Generate a random 4-char room code
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // --- BroadcastChannel Mode (Local cross-tab multiplayer) ---
  createRoom(gameId) {
    if (typeof BroadcastChannel === 'undefined') {
      throw new Error('BroadcastChannel is not available in this browser.');
    }
    this.roomCode = NetworkManager.generateRoomCode();
    this.isHost = true;
    this.mode = 'broadcast';
    const channelName = `timepass_mp_${this.roomCode}_${gameId}`;
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (e) => this._handleMessage(e.data);

    // Also set up a signaling channel for WebRTC offers
    this.signalingChannel = new BroadcastChannel(`timepass_signal_${this.roomCode}`);
    this.signalingChannel.onmessage = (e) => this._handleSignaling(e.data);

    // Store room info in localStorage for discovery
    let rooms = {};
    try {
      rooms = JSON.parse(localStorage.getItem('timepass_mp_rooms') || '{}');
    } catch (error) {
      console.warn('Could not read multiplayer room storage:', error);
    }
    rooms[this.roomCode] = { gameId, host: true, created: Date.now() };
    try {
      localStorage.setItem('timepass_mp_rooms', JSON.stringify(rooms));
    } catch (error) {
      console.warn('Could not persist multiplayer room metadata:', error);
    }

    return this.roomCode;
  }

  joinRoom(roomCode, gameId) {
    if (typeof BroadcastChannel === 'undefined') {
      throw new Error('BroadcastChannel is not available in this browser.');
    }
    const normalizedCode = roomCode.toUpperCase();
    let rooms = {};
    try {
      rooms = JSON.parse(localStorage.getItem('timepass_mp_rooms') || '{}');
    } catch (error) {
      console.warn('Could not read multiplayer room storage:', error);
    }
    if (rooms[normalizedCode] && rooms[normalizedCode].gameId !== gameId) return false;

    this.roomCode = normalizedCode;
    this.isHost = false;
    this.mode = 'broadcast';
    const channelName = `timepass_mp_${this.roomCode}_${gameId}`;
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (e) => this._handleMessage(e.data);

    this.signalingChannel = new BroadcastChannel(`timepass_signal_${this.roomCode}`);
    this.signalingChannel.onmessage = (e) => this._handleSignaling(e.data);

    this.channel.postMessage({
      type: 'system',
      action: 'player_joined',
      isHost: false,
      sender: 'guest',
      timestamp: Date.now()
    });

    return true;
  }

  // --- Core messaging API (Socket.io compatible interface) ---
  sendMove(data) {
    const payload = {
      type: 'move',
      data: data,
      sender: this.isHost ? 'host' : 'guest',
      timestamp: Date.now()
    };

    if (this.mode === 'webrtc' && this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(payload));
    } else if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  sendState(state) {
    const payload = {
      type: 'state',
      data: state,
      sender: this.isHost ? 'host' : 'guest',
      timestamp: Date.now()
    };

    if (this.mode === 'webrtc' && this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(payload));
    } else if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  sendChat(message) {
    const payload = {
      type: 'chat',
      data: { message },
      sender: this.isHost ? 'host' : 'guest',
      timestamp: Date.now()
    };

    if (this.mode === 'broadcast' && this.channel) {
      this.channel.postMessage(payload);
    }
  }

  // --- Callbacks ---
  onReceiveMove(callback) {
    this.onReceiveCallbacks.push(callback);
  }

  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
  }

  _handleMessage(payload) {
    if (!payload) return;

    // Don't echo own messages back
    const mySide = this.isHost ? 'host' : 'guest';
    if (payload.sender === mySide) return;

    if (payload.type === 'system') {
      if (payload.action === 'player_joined') {
        this.connected = true;
        this._notifyConnect();
        // Host acknowledges connection
        if (this.isHost && this.channel) {
          this.channel.postMessage({
            type: 'system',
            action: 'host_ack',
            sender: 'host',
            timestamp: Date.now()
          });
        }
      } else if (payload.action === 'host_ack') {
        this.connected = true;
        this._notifyConnect();
      } else if (payload.action === 'player_left') {
        this.connected = false;
        this._notifyDisconnect();
      }
    } else {
      this.onReceiveCallbacks.forEach((cb) => cb(payload));
    }
  }

  _handleSignaling(data) {
    if (!data || data.sender === (this.isHost ? 'host' : 'guest')) return;
    if (data.type === 'webrtc_offer' && !this.isHost) {
      this._acceptOffer(data.sdp).catch((error) => {
        console.warn('WebRTC offer failed; keeping BroadcastChannel connection:', error);
      });
    } else if (data.type === 'webrtc_answer' && this.isHost && this.pc) {
      this.pc.setRemoteDescription(data.sdp).catch((error) => {
        console.warn('WebRTC answer failed; keeping BroadcastChannel connection:', error);
      });
    }
  }

  async _waitForIceGathering(pc = this.pc) {
    if (!pc || pc.iceGatheringState === 'complete') return;
    await new Promise((resolve) => {
      const finish = () => {
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        resolve();
      };
      const timeout = setTimeout(finish, 5000);
      const onStateChange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          finish();
        }
      };
      pc.addEventListener('icegatheringstatechange', onStateChange);
    });
  }

  _bindDataChannel(channel) {
    this.dc = channel;
    channel.onopen = () => {
      this.mode = 'webrtc';
      this.connected = true;
      this._notifyConnect();
    };
    channel.onmessage = (event) => {
      try {
        this._handleMessage(JSON.parse(event.data));
      } catch (error) {
        console.warn('Ignoring malformed multiplayer data-channel message:', error);
      }
    };
    channel.onclose = () => {
      this.mode = 'broadcast';
      this.connected = Boolean(this.channel);
      if (!this.connected) this._notifyDisconnect();
    };
  }

  async _acceptOffer(offer) {
    if (!window.RTCPeerConnection || !this.signalingChannel) return;
    const signaling = this.signalingChannel;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    this.pc = pc;
    pc.ondatachannel = (event) => this._bindDataChannel(event.channel);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this._waitForIceGathering(pc);
    if (this.pc !== pc || this.signalingChannel !== signaling) return;
    signaling.postMessage({
      type: 'webrtc_answer',
      sdp: pc.localDescription.toJSON
        ? pc.localDescription.toJSON()
        : { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
      sender: 'guest'
    });
  }

  _notifyConnect() {
    this.onConnectCallbacks.forEach((cb) => cb());
  }

  _notifyDisconnect() {
    this.onDisconnectCallbacks.forEach((cb) => cb());
  }

  // --- WebRTC P2P upgrade (manual signaling via BroadcastChannel) ---
  async upgradeToWebRTC() {
    if (!window.RTCPeerConnection || !this.isHost || !this.signalingChannel ||
        !this.roomCode || this.pc || this.mode === 'webrtc') return false;

    try {
      const signaling = this.signalingChannel;
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      this.pc = pc;

      if (this.isHost) {
        this._bindDataChannel(pc.createDataChannel('game'));

        const offer = await pc.createOffer();
        if (this.pc !== pc || this.signalingChannel !== signaling) return false;
        await pc.setLocalDescription(offer);
        await this._waitForIceGathering(pc);
        if (this.pc !== pc || this.signalingChannel !== signaling) return false;
        signaling.postMessage({
          type: 'webrtc_offer',
          sdp: pc.localDescription.toJSON
            ? pc.localDescription.toJSON()
            : { type: pc.localDescription.type, sdp: pc.localDescription.sdp },
          sender: 'host'
        });
      }

      return true;
    } catch (err) {
      console.warn('WebRTC upgrade failed, staying on BroadcastChannel:', err);
      if (this.pc) this.pc.close();
      this.pc = null;
      this.dc = null;
      this.mode = 'broadcast';
      return false;
    }
  }

  // --- Cleanup ---
  disconnect() {
    if (this.channel) {
      this.channel.postMessage({
        type: 'system',
        action: 'player_left',
        sender: this.isHost ? 'host' : 'guest'
      });
      this.channel.close();
      this.channel = null;
    }
    if (this.signalingChannel) {
      this.signalingChannel.close();
      this.signalingChannel = null;
    }
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Clean up room from localStorage
    if (this.roomCode && this.isHost) {
      try {
        const rooms = JSON.parse(localStorage.getItem('timepass_mp_rooms') || '{}');
        delete rooms[this.roomCode];
        localStorage.setItem('timepass_mp_rooms', JSON.stringify(rooms));
      } catch (error) {
        console.warn('Could not remove multiplayer room metadata:', error);
      }
    }

    this.connected = false;
    this.roomCode = null;
    this.mode = 'broadcast';
  }

  // --- Socket.io adapter hook (drop-in when deploying with Node relay) ---
  static createSocketIOAdapter(serverUrl) {
    // Usage: const net = NetworkManager.createSocketIOAdapter('wss://your-server.com');
    // net.onReceiveMove(cb); net.sendMove(data);
    // Requires: <script src="/socket.io/socket.io.js"></script>
    const adapter = {
      socket: null,
      roomCode: null,
      isHost: false,
      connected: false,
      _callbacks: [],
      _connectCallbacks: [],
      _disconnectCallbacks: [],

      connect(url) {
        if (typeof io === 'undefined') {
          throw new Error('Socket.io client is not loaded.');
        }
        this.socket = io(url || serverUrl);
        this.socket.on('connect', () => {
          this.connected = true;
          this._connectCallbacks.forEach((callback) => callback());
        });
        this.socket.on('disconnect', () => {
          this.connected = false;
          this._disconnectCallbacks.forEach((callback) => callback());
        });
        this.socket.on('connect_error', (error) => {
          console.error('Socket.io multiplayer connection failed:', error);
        });
        this.socket.on('game_move', (data) => {
          this._callbacks.forEach((cb) => cb(data));
        });
      },

      createRoom(gameId) {
        if (!this.socket || !this.connected) throw new Error('Connect to the Socket.io relay before creating a room.');
        this.isHost = true;
        this.roomCode = NetworkManager.generateRoomCode();
        this.socket.emit('create_room', { roomCode: this.roomCode, gameId });
        return this.roomCode;
      },

      joinRoom(code, gameId) {
        if (!this.socket || !this.connected) throw new Error('Connect to the Socket.io relay before joining a room.');
        this.isHost = false;
        this.roomCode = code.toUpperCase();
        this.socket.emit('join_room', { roomCode: this.roomCode, gameId });
        return true;
      },

      sendMove(data) {
        if (!this.socket || !this.connected || !this.roomCode) {
          throw new Error('Socket.io multiplayer is not connected to a room.');
        }
        this.socket.emit('game_move', {
          roomCode: this.roomCode,
          data,
          sender: this.isHost ? 'host' : 'guest'
        });
      },

      sendState(data) {
        this.sendMove(data);
      },

      onReceiveMove(callback) {
        this._callbacks.push(callback);
      },

      onConnect(callback) {
        this._connectCallbacks.push(callback);
      },

      onDisconnect(callback) {
        this._disconnectCallbacks.push(callback);
      },

      disconnect() {
        if (this.socket) this.socket.disconnect();
        this.socket = null;
        this.roomCode = null;
        this.connected = false;
      }
    };

    return adapter;
  }
}

window.NetworkManager = NetworkManager;
