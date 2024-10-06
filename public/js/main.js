const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const AllUsersHtml = document.getElementById("allusers");
const socket = io();
let localStream;
let targetUser = null; // Track the user we're calling

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Singleton pattern for peer connection
const peerConnection = (function () {
  let peerConnection;

  const createpeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };
    peerConnection = new RTCPeerConnection(config);

    // Add local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Listen for remote stream and add to video element
    peerConnection.ontrack = function (event) {
      remoteVideo.srcObject = event.streams[0];
    };

    // Listen for ICE candidates and send them to the remote user
    peerConnection.onicecandidate = function (e) {
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
      if (!peerConnection) peerConnection = createpeerConnection();
      return peerConnection;
    },
  };
})();

// Handle browser events
createUserBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    const usernameContainer = document.querySelector(".username-input");
    socket.emit("join-user", username.value);
    usernameContainer.style.display = "none";
  }
});

// Handle socket events
socket.on("joined", (allUsers) => {
  console.log(allUsers);

  AllUsersHtml.innerHTML = "";

  const allUserContainer = () => {
    for (const user in allUsers) {
      const li = document.createElement("li");
      li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

      if (user != username.value) {
        const button = document.createElement("button");

        button.classList.add("call-btn");
        const img = document.createElement("img");
        button.addEventListener("click", () => {
          startCall(user);
        });

        img.setAttribute("src", "/images/phone.png");
        img.setAttribute("width", 20);

        button.appendChild(img);
        li.appendChild(button);
      }
      AllUsersHtml.appendChild(li);
    }
  };
  allUserContainer();
});

socket.on("offer", async ({ from, to, offer }) => {
  const pc = peerConnection.getInstance();

  // Set remote description
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Emit the answer back to the original caller
  socket.emit("answer", {
    from: username.value,
    to,
    answer: pc.localDescription,
  });
});

socket.on("answer", async ({ from, to, answer }) => {
  const pc = peerConnection.getInstance();
  await pc.setRemoteDescription(answer);
});

socket.on("ICECandidate", async ({ from, to, candidate }) => {
  const pc = peerConnection.getInstance();
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// Start Call method
const startCall = async (user) => {
  targetUser = user; // Set the target user for the call
  console.log(user);
  const pc = peerConnection.getInstance();
  const offer = await pc.createOffer();
  console.log({ offer });
  await pc.setLocalDescription(offer);

  socket.emit("offer", {
    from: username.value,
    to: user,
    offer: pc.localDescription,
  });
};

// Initialize the local video stream
const startVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStream = stream;
    localVideo.srcObject = stream;
  } catch (e) {
    console.log(e);
  }
};

startVideo();
