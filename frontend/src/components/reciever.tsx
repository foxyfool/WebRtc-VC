import { useEffect, useRef, useState } from "react";

export const Receiver = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  //   const [userInteracted, setUserInteracted] = useState(false);
  useEffect(() => {
    // This is the websocket connection to the server
    const socket = new WebSocket("ws://localhost:8080");

    // This is the message that is received from the server to identify the receiver
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      let pc;
      if (message.type === "createOffer") {
        // create an answer

        pc = new RTCPeerConnection();
        pc.setRemoteDescription(message.sdp);

        pc.onicecandidate = (event) => {
          console.log(event);
          if (event.candidate) {
            socket.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
              })
            );
          }
        };

        pc.ontrack = (event) => {
          console.log("ontrack event:", event);
          const videoElement = videoRef.current;
          if (videoElement) {
            console.log("videoElement exists");
            videoElement.srcObject = new MediaStream([event.track]);
            videoElement.play();
          } else {
            console.log("videoElement is null or undefined");
          }
        };

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.send(
          JSON.stringify({
            type: "createAnswer",
            sdp: pc.localDescription,
          })
        );
      } else if (message.type === "iceCandidate") {
        if (!pc) {
          return;
        }
        //@ts-ignore
        pc.addIceCandidate(message.candidate);
      } else {
        console.log("No message type");
      }
    };
  }, []);

  return (
    <>
      <button onClick={() => setUserInteracted(true)}>Allow Video</button>
      <video ref={videoRef} autoPlay={userInteracted} />
    </>
  );
};
