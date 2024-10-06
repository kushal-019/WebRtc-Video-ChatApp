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

        // add local strings to peer connnections
        // listen to remote stream and add to peer connection
        // listen to ICE candidate

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


// Start Call method
const startCall=(user)=>{
    console.log(user);
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