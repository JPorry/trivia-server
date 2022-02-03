const cors = require('cors');
const { app, server } = require('./server');

// Enable CORS (required for non-websocket connections when using
// socket.io)
app.use(cors());

// Configure sockets
require('./sockets');

app.get("/", function (req, res) {
  res.send("<h1>Hello World</h1>")
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
