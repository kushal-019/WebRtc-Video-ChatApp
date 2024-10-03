import express from "express";
import dotenv from "dotenv";
import {createServer} from "http";
import {Server} from 'socket.io'

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT;

// Assigning port to use 
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Socket connection 

io.on("connection" , (socket)=>{
    console.log(`Someone joined the socket and thier id is  ${socket.id}`);
})


// Handling get request for http
app.get("/", (req, res) => {
    res.send("Welcome to the WebRTC Vedio chating app");
  });