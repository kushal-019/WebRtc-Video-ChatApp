import express from "express";
import dotenv from "dotenv";
import {createServer} from "http";
import {Server} from 'socket.io'
import { fileURLToPath, pathToFileURL } from "url";
import { dirname , join } from "path";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT;

// fetching path of present working directory and file name
const __dirname = dirname(fileURLToPath(import.meta.url));

// exposing public folder to outside world
app.use(express.static("public"));

// Assigning port to use 
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Handling get request for http
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "app", "index.html"));
  });


// Socket connection 
io.on("connection" , (socket)=>{
    console.log(`Someone joined the socket and thier id is  ${socket.id}`);
})

