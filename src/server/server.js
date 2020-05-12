var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server, { cookie: false });
var path = require("path");

var GoatGame = require("./goat-game");

app.use(express.static(path.join(__dirname, "/../client")));

const port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log("Listening on port: " + port);
    console.log(`http://localhost:${port}/`);
});

var serverStartTime = new Date();
const adminPassword = process.env.PASSWORD || "";

var connections = [];
function AddConnection(socketId) {
    connections.push(socketId);
}

function RemoveConnection(socketIdToRemove) {
    let index = connections.findIndex(function (socketId) {
        return socketId == socketIdToRemove;
    });

    if (index == -1) {
        return;
    }

    connections[index];
    connections.splice(index, 1);
}

io.on("connection", function (socket) {
    console.log("A user connected");

    socket.on("disconnect", function () {
        RemoveConnection(socket.id);

        GoatGame.RemoveDog(socket.id);

        socket.emit("game-user-disconnect", socket.id);
        console.log("A user disconnected");
    });

    socket.on("game-new-player", function () {
        AddConnection(socket.id);

        GoatGame.AddDog(socket.id);

        io.to(socket.id).emit("game-board-setup", GoatGame.board);
    });

    socket.on("game-input", function (input) {
        GoatGame.SetInputState(socket.id, input);
    });

    function BroadcastRenderState(renderState) {
        io.sockets.emit("game-render", renderState);
    }

    GoatGame.onRenderState = BroadcastRenderState;

    // Stats function go below this
    socket.on("admin-ping", function (number) {
        io.to(socket.id).emit("admin-pong", number);
    });

    socket.on("stats-get-server-up-time", function () {
        var upTimeMilliseconds = new Date() - serverStartTime;

        var totalSeconds = upTimeMilliseconds / 1000;
        var totalMinutes = totalSeconds / 60;
        var totalHours = totalMinutes / 60;

        var seconds = Math.round(totalSeconds) % 60;
        var minutes = Math.round(totalMinutes) % 60;
        var hours = Math.round(totalHours);

        var upTimeString = `${hours} hours ${minutes} minutes ${seconds} seconds`;

        io.to(socket.id).emit("stats-return-server-up-time", upTimeString);
    });

    // Admin functions go below this
    socket.on("admin-reset-goats", function (password) {
        if (password != adminPassword) {
            return;
        }

        GoatGame.ResetGoats();
    });

    socket.on("admin-reset-score", function (password) {
        if (password != adminPassword) {
            return;
        }

        GoatGame.ResetScore();
    });

    socket.on("admin-reset-all", function (password) {
        if (password != adminPassword) {
            return;
        }

        GoatGame.ResetGoats();
        GoatGame.ResetScore();
    });

    socket.on("admin-get-connections-list", function () {
        io.to(socket.id).emit("admin-connections-list", connections);
    });
});
