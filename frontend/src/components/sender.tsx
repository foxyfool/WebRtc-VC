import { set } from "mongoose";
import { useEffect, useState } from "react";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    // This is the websocket connection to the server
    const socket = new WebSocket("ws://localhost:8080");

    // This is the message that is sent to the server to identify the sender
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };
    setSocket(socket);
  }, []);

  async function startSending() {
    if (!socket) {
      return;
    }
    // create an offer
    const pc = new RTCPeerConnection();

    pc.onnegotiationneeded = async () => {
      console.log("negotiation needed");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.send(
        JSON.stringify({ type: "createOffer", sdp: pc.localDescription })
      );
    };
    pc.onicecandidate = (event) => {
      console.log(event);
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      }
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createAnswer") {
        await pc.setRemoteDescription(message.sdp);
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    pc.addTrack(stream.getVideoTracks()[0]);
    pc.addTrack(stream.getAudioTracks()[1]);
  }
  return (
    <div>
      <button onClick={startSending}>Send</button>
    </div>
  );
};
