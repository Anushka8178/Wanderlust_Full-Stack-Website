const mongoose = require("mongoose");
const uri = "mongodb+srv://anushka:Anushka06@cluster0.gcnce.mongodb.net/wanderlust?retryWrites=true&w=majority";

console.log("Connecting...");
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("CONNECTED_SUCCESS");
    process.exit(0);
  })
  .catch(err => {
    console.error("CONN_FAIL:", err.message);
    process.exit(1);
  });
