const createUserBtn  = document.getElementById("create-user");
const username  = document.getElementById("username");
const AllUsersHtml  = document.getElementById("allusers");
const socket = io();
let localStream;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// this is a singleton function 
// the function that calls itself
const peerConnection=(function(){
    let peerConnection;

    const createpeerConnection=()=>{
        const config = {
            iceServers:[
                {
                    // Source of ICE Candidate
                    urls : 'stun:stunl.goofle.com.:19302'
                }
            ] 
        };
        // creates a ICE Candidate or public ip address
        peerConnection = new RTCPeerConnection(config);

        // add local stream to peer connnections
        localStream.getTracks().forEach(track=>{
            peerConnection.addTrack(track , localStream);
        })
        // listen to remote stream and add to peer connection
        peerConnection.onTrack = function(event){
            remoteVideo.srcObject = event.streams[0];
        };
        // listen to ICE candidate
        peerConnection.onicecandidate = function(e){
            if(e.candidate){
                
            }
        }

        return peerConnection;
    }

    return {
        getInstance:()=>{
            if(!peerConnection)peerConnection = createpeerConnection();
            return peerConnection;
        }
    }
})();



// handle browser events
createUserBtn.addEventListener("click" , (e)=>{
    if(username.value !== ""){
        const usernameContainer  = document.querySelector(".username-input");
        socket.emit("join-user" , username.value);
        usernameContainer.style.display="none";
    }
})


// handle socket events

socket.on("joined" , allUsers=>{
    console.log(allUsers);

    AllUsersHtml.innerHTML = "";

    const allUserContainer =()=> {
        for(const user in allUsers){
            const li = document.createElement("li");
            li.textContent= `${user} ${user === username.value ? "(You)" : ""}`;

            if(user != username.value){
                const button = document.createElement("button");

                button.classList.add("call-btn");
                const img = document.createElement("img");
                button.addEventListener("click" , ()=>{
                    startCall(user);
                })

                img.setAttribute("src" , "/images/phone.png");
                img.setAttribute("width" , 20);

                button.appendChild(img);
                li.appendChild(button);
                

            }
            AllUsersHtml.appendChild(li);
        }
    }
    allUserContainer();
})

socket.on("offer" ,async({from , to,offer})=>{
    const pc = peerConnection.getInstance();

    // set remote description;

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit(("answer" , {from , to,  answer : pc.localDescription}));
})



// Start Call method
const startCall=async(user)=>{
    console.log(user);
    const pc = peerConnection.getInstance();
    const offer = await pc.createOffer();
    console.log({offer})
    await pc.setLocalDescription(offer);

    socket.emit("offer" ,{from : username.value , to : user , offer :  pc.localDescription  });
}


// initialize app
const startVideo=async()=>{
    try{
        const stream =  await navigator.mediaDevices.getUserMedia({audio : true , video : true});

        localStream = stream;
        localVideo.srcObject= stream;

    }
    catch(e){
        console.log(e);
    }
};

startVideo();