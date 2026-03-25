const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const reportRoutes = require('./routes/reportR');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/reports', reportRoutes);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Reporting service connected to MongoDB"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Reporting service running on port ${PORT}`));