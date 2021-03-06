var socket = io();

socket.emit("stats-get-server-up-time");

socket.on("stats-return-server-up-time", function (serverUpTime) {
    var serverUpTimeElement = document.getElementById("serverUpTimeDisplay");
    serverUpTimeElement.innerText = `${serverUpTime}`;
});

var networkLatencyStartTime;
function CheckNetworkLatency() {
    networkLatencyStartTime = new Date();
    socket.emit("admin-ping", 0);
}

socket.on("admin-pong", function (number) {
    var networkLatencyStopTime = new Date();
    var networkLatency = networkLatencyStopTime - networkLatencyStartTime;

    var networkLatencyElement = document.getElementById(
        "networkLatencyDisplay"
    );

    networkLatencyElement.innerText = `${networkLatency} milliseconds`;
});
