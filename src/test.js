import express from "express";
const app = express();

app.get("/", (req, res) => {
  console.log("✅ Request hit");
  res.send("Hello world!");
});

app.listen(3001, () => console.log("Server running on 3001"));
