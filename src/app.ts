import express from "express";
const cors = require("cors");   // ✅ یہی صحیح ہے
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

export default app;
