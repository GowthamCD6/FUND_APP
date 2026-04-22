const express = require('express');
const cors = require('cors');
const { initializeReportsTables } = require('./config/reportsDbInit');

const app = express();
app.use(cors());
app.use(express.json());

initializeReportsTables();

// Log requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`, req.body);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));


module.exports = app;