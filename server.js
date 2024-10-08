import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);
const allUsers = {};

const port = process.env.PORT;

// Fetching path of present working directory and file name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Exposing public folder to outside world
app.use(express.static("public"));

// Handling get request for http
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "app", "index.html"));
});

// Assigning port to use
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Socket connection
io.on("connection", (socket) => {
  console.log(`Someone joined the socket and their id is ${socket.id}`);

  socket.on("join-user", (username) => {
    console.log(
      `${username} joined the socket connection with ${socket.id} id`
    );
    // Updating Global users with all existing users
    allUsers[username] = { username, id: socket.id };

    io.emit("joined", allUsers);
  });

  socket.on("offer", ({ from, to, offer }) => {
    io.to(allUsers[to].id).emit("offer", { from, to, offer });
  });

  socket.on("end-call", ({ from, to }) => {
    io.to(allUsers[to].id).emit("end-call", { from, to });
  });

  socket.on("call-ended", (caller) => {
    const [from, to] = caller;
    io.to(allUsers[from].id).emit("call-ended", caller);
    io.to(allUsers[to].id).emit("call-ended", caller);
  });

  socket.on("answer", ({ from, to, answer }) => {
    try {
      io.to(allUsers[to].id).emit("answer", { from, to, answer });
    } catch (error) {
      console.error("Error in answer handler:", error);
    }
  });

  socket.on("ICECandidate", ({ from, to, candidate }) => {
    // Make sure to include both the 'from' and 'to' parameters
    // Send candidate to the specified "to" user
    io.to(allUsers[to].id).emit("ICECandidate", { from, to, candidate });
  });
});
