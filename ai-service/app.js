const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const fileRoutes = require('./routes/file');
app.use('/chat', fileRoutes);



app.use("/chat", require("./routes/chat.routes"));

app.listen(7000, () =>
  console.log("🤖 AI Service running on port 7000")
);
