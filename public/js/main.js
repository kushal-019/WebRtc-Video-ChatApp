const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const AllUsersHtml = document.getElementById("allusers");
const endCallBtn = document.getElementById("end-call-btn");
const socket = io();
let localStream;
let targetUser = null;
let caller = [];

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Improved peer connection singleton
const peerConnection = (function () {
  let peerConnection;

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    };
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ICECandidate", {
          from: username.value,
          to: targetUser,
          candidate: e.candidate,
        });
      }
    };

    return peerConnection;
  };

  return {
    getInstance: () => {
      if (!peerConnection) peerConnection = createPeerConnection();
      return peerConnection;
    },
  };
})();

createUserBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    const usernameContainer = document.querySelector(".username-input");
    socket.emit("join-user", username.value);
    usernameContainer.style.display = "none";
  }
});
endCallBtn.addEventListener("click", (e) => {
  socket.emit("call-ended", caller)
});

socket.on("joined", (allUsers) => {
  console.log("Updated user list:", allUsers);
  AllUsersHtml.innerHTML = "";
  for (const user in allUsers) {
    const li = document.createElement("li");
    li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

    if (user !== username.value) {
      const button = document.createElement("button");
      button.classList.add("call-btn");
      const img = document.createElement("img");
      button.addEventListener("click", () => startCall(user));
      img.setAttribute("src", "/images/phone.png");
      img.setAttribute("width", 20);
      button.appendChild(img);
      li.appendChild(button);
    }

    AllUsersHtml.appendChild(li);
  }
});

socket.on("offer", async ({ from, to, offer }) => {
  targetUser = from;
  const pc = peerConnection.getInstance();
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", {from: username.value, to: from, answer: pc.localDescription,});
    caller = [from, to];
  } 
  catch (error) {
    console.error("Error handling offer:", error);
  }
});

socket.on("answer", async ({ from, to, answer }) => {
  const pc = peerConnection.getInstance();
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    endCallBtn.style.display = 'block';
    socket.emit("end-call", {from, to});
    caller = [from, to];
  } 
  catch (error) {
    console.error("Error setting remote description:", error);
  }
  
});

socket.on("end-call", ({from, to}) => {
  endCallBtn.style.display = "block";
});
socket.on("call-ended", (caller) => {
  endCall();
})

socket.on("ICECandidate", async ({ from, to, candidate }) => {
  const pc = peerConnection.getInstance();
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
});

const startCall = async (user) => {
  targetUser = user;
  const pc = peerConnection.getInstance();
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", {
      from: username.value,
      to: user,
      offer: pc.localDescription,
    });
  } catch (error) {
    console.error("Error in startCall:", error);
  }
};

const endCall = () => {
  const pc = peerConnection.getInstance();
  if(pc) {
      pc.close();
      endCallBtn.style.display = 'none';
  }
}

const startVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStream = stream;
    localVideo.srcObject = stream;

    // Add local tracks to the peer connection after obtaining the stream
    const pc = peerConnection.getInstance();
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  } catch (e) {
    console.error("Error accessing media devices:", e);
  }
};

startVideo();

// Add these lines at the end of the file for additional debugging
remoteVideo.onloadedmetadata = () => {
  console.log("Remote video metadata loaded");
  remoteVideo
    .play()
    .then(() => console.log("Remote video playing"))
    .catch((e) => console.error("Error playing remote video:", e));
};

// Log any errors that occur with the remote video
remoteVideo.onerror = (error) => {
  console.error("Remote video error:", error);
};
