const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));

app.listen(5001, () => {
  console.log("Auth Microservice running on PORT 5001");
});