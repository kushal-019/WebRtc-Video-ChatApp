const createUserBtn  = document.getElementById("create-user");
const username  = document.getElementById("username");
const AllUsersHtml  = document.getElementById("allusers");
const socket = io();

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