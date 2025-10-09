const app = require('./src/app');
const PORT = process.env.PORT;
const http = require('http');
const server = http.createServer(app);

const db = require('./src/config/db')

app.get("/", (req, res) => {
  res.send("OK");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});