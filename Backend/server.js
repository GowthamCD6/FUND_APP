const app = require('./src/app');
const PORT = process.env.PORT || 5000;
const http = require('http');
const server = http.createServer(app);

const db = require('./src/config/db')

app.get("/", (req, res) => {
  res.send("OK");
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});