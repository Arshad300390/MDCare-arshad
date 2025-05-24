/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import { AppState } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { navigate, navigationRef } from '../navigation/NavigationService';
import InCallManager from 'react-native-incall-manager';

const SOCKET_SERVER_URL = 'http://10.0.2.2:8000';
//const SOCKET_SERVER_URL = 'http://192.168.1.19:8000';
const WebRTCContext = createContext(null);

export const WebRTCProvider = ({ children }) => {
  const appState = useRef(AppState.currentState);
  const signalingMessageQueue = useRef([]);
  const isRemoteDescriptionSet = useRef(false);
  const otherUserId = useRef(null);
  const currentRoomId = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const remoteRTCMessage = useRef(null);
  const hasLeftCall = useRef(false);
  const isCallActive = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [myId, setMyId] = useState('');

  const senderId = useSelector(state => state.auth.user?.id);

  // Set myId from redux senderId
  useEffect(() => {
    if (senderId) setMyId(senderId);
  }, [senderId]);

  // AppState listener
 useEffect(() => {
  const handleAppStateChange = nextAppState => {
    appState.current = nextAppState;
  };
  const unsubscribe = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}, []);

  // Setup RNCallKeep once
  useEffect(() => {
    (async () => {
      try {
        await RNCallKeep.setup({
          ios: { appName: 'My app name' },
          android: {
            alertTitle: 'Permissions required',
            alertDescription: 'This app needs to access your phone accounts',
            cancelButton: 'Cancel',
            okButton: 'OK',
            foregroundService: {
              channelId: 'call',
              channelName: 'Foreground service for calls',
              notificationTitle: 'Call service active',
              notificationIcon: 'ic_launcher',
            },
          },
        });
        RNCallKeep.setAvailable(true);
      } catch (error) {
        console.error('CallKeep setup error:', error);
      }
    })();
  }, []);

  // Listen to RNCallKeep answer/end events once
  useEffect(() => {
    let callAnswered = false;

    const onAnswerCall = async ({ callUUID }) => {
      if (callAnswered) return;
      callAnswered = true;
      try {
        const pendingCallId = await AsyncStorage.getItem('pendingCall');
        if (pendingCallId === callUUID) {
          await processAccept(callUUID);
          RNCallKeep.backToForeground();
          await AsyncStorage.removeItem('pendingCall');
          //RNCallKeep.endCall(callUUID);
        }
      } catch (error) {
        console.error('Error handling answerCall:', error);
      }
    };

    const onEndCall = () => leave();

    RNCallKeep.addEventListener('answerCall', onAnswerCall);
    RNCallKeep.addEventListener('endCall', onEndCall);

    return () => {
      RNCallKeep.removeEventListener('answerCall', onAnswerCall);
      RNCallKeep.removeEventListener('endCall', onEndCall);
    };
  }, []);

  // Initialize and manage socket connection
  useEffect(() => {
    if (!myId) return;

    const initializeSocket = async () => {
      try {
        const fcmToken = await AsyncStorage.getItem('fcmToken');
        socket.current = io(SOCKET_SERVER_URL, {
          transports: ['websocket'],
          query: { callerId: myId, fcmToken },
        });

        socket.current.on('connect', () => console.log('Connected to signaling server'));
        socket.current.on('disconnect', () => console.warn('Disconnected from server'));
        socket.current.on('connect_error', err => console.error('Socket error:', err));

        socket.current.on('callEnded', () => {
          leave(true);
          const currentRoute = navigationRef?.getCurrentRoute()?.name;
          navigationRef.navigate(
            currentRoute === 'InCall' || currentRoute === 'Receiving' ? 'Consultant' : 'Receiving'
          );
        });

        socket.current.on('newCall', async data => {
          remoteRTCMessage.current = data.rtcMessage;
          otherUserId.current = data.callerId;
          currentRoomId.current = data.roomId;

          try {
            await AsyncStorage.setItem('pendingCall', data.roomId);

            if (appState.current !== 'active') {
              RNCallKeep.displayIncomingCall(
                data.roomId,
                data.callerId || 'Unknown Caller',
                'Incoming Video Call',
                'generic',
                true
              );
            } else {
              navigate('Receiving', { otherId: data.callerId });
            }
          } catch (err) {
            console.error('Failed to handle new call:', err);
          }
        });

        socket.current.on('callAnswered', async data => {
          remoteRTCMessage.current = data.rtcMessage;
          await handleOffer(remoteRTCMessage.current);
          InCallManager.start({ media: 'audio' });
          InCallManager.setSpeakerphoneOn(true);
          navigate('InCall');
        });

        socket.current.on('ICEcandidate', data => handleIceCandidate(data.rtcMessage));
      } catch (err) {
        console.error('Socket initialization error:', err);
      }
    };

    initializeSocket();

    return () => {
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [myId]);

  // Initialize peer connection and its handlers
  const initializePeerConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    peerConnection.current.onicecandidate = event => {
      if (event.candidate && otherUserId.current && socket.current) {
        socket.current.emit('ICEcandidate', {
          calleeId: otherUserId.current,
          rtcMessage: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    peerConnection.current.ontrack = event => {
      if (event.streams?.[0]) setRemoteStream(event.streams[0]);
    };
  };

  // Get media stream from device
  const setupMediaStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Media stream error:', error);
      return null;
    }
  };

  // Handle incoming offer SDP
  const handleOffer = async offer => {
    if (!peerConnection.current) {
      signalingMessageQueue.current.push({ type: 'offer', data: offer });
      return;
    }

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      isRemoteDescriptionSet.current = true;
      flushQueuedMessages();
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = candidateData => {
    const candidate = new RTCIceCandidate(candidateData);
    if (!peerConnection.current || !isRemoteDescriptionSet.current) {
      signalingMessageQueue.current.push({ type: 'ice-candidate', data: candidateData });
      return;
    }
    peerConnection.current
      .addIceCandidate(candidate)
      .catch(err => console.error('Error adding ICE candidate:', err));
  };

  // Flush queued ICE candidates after remote description is set
  const flushQueuedMessages = () => {
    signalingMessageQueue.current.forEach(msg => {
      if (msg.type === 'ice-candidate') {
        peerConnection.current
          ?.addIceCandidate(new RTCIceCandidate(msg.data))
          .catch(err => console.error('Error flushing ICE candidate:', err));
      }
    });
    signalingMessageQueue.current = [];
  };

  // Initiate a call (caller)
  const processCall = async roomId => {
    isCallActive.current = true;
    currentRoomId.current = roomId;
    try {
      initializePeerConnection();
      const stream = await setupMediaStream();
      if (!stream) return;

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.current.emit('call', {
        calleeId: otherUserId.current,
        rtcMessage: offer,
        roomId,
      });
    } catch (err) {
      console.error('processCall error:', err);
    }
  };

  // Accept incoming call (callee)
  const processAccept = async roomId => {
    isCallActive.current = true;
    currentRoomId.current = roomId;
    try {
      const offer = remoteRTCMessage.current;
      if (!offer) return;

      initializePeerConnection();

      // Small delay to ensure peerConnection is fully initialized before proceeding
      await new Promise(resolve => setTimeout(resolve, 0));

      const stream = await setupMediaStream();
      if (!stream) return;

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      await handleOffer(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.current.emit('answerCall', {
        callerId: otherUserId.current,
        rtcMessage: answer,
        roomId,
      });

      InCallManager.start({ media: 'audio' });
      InCallManager.setSpeakerphoneOn(true);
      setTimeout(() => navigate('InCall', { otherId: roomId }), 500);
    } catch (err) {
      console.error('processAccept error:', err);
      leave();
    }
  };

  // Leave the call (cleanup)
  const leave = (isSocketInitiated = false) => {
    if (hasLeftCall.current || !isCallActive.current) return;
    isCallActive.current = false;
    hasLeftCall.current = true;

    localStream?.getTracks().forEach(track => track.stop());

    if (peerConnection.current) {
      peerConnection.current.getTransceivers()?.forEach(transceiver => {
        try {
          transceiver.stop();
        } catch (e) {
          console.warn('Error stopping transceiver:', e);
        }
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    RNCallKeep.endAllCalls();

    setLocalStream(null);
    setRemoteStream(null);

    if (!isSocketInitiated && otherUserId.current) {
      socket.current?.emit('endCall', {
        calleeId: otherUserId.current,
        roomId: currentRoomId.current,
      });
    }

    otherUserId.current = null;
    currentRoomId.current = null;
    signalingMessageQueue.current = [];
    isRemoteDescriptionSet.current = false;

    setTimeout(() => {
      navigationRef?.navigate('Consultant');
      hasLeftCall.current = false;
    }, 500);
  };

  const value = {
    localStream,
    remoteStream,
    callerId: myId,
    otherUserId: otherUserId.current,
    setOtherUserId: id => (otherUserId.current = id),
    processCall,
    processAccept,
    leave,
  };

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
