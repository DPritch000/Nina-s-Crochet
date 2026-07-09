const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve everything inside the Client folder as static files
app.use(express.static(path.join(__dirname, 'Client')));

app.listen(PORT, () => {
  console.log(`Nina's Crochet is running on port ${PORT}`);
});
