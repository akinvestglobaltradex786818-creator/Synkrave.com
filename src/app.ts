import express from "express";
import * as cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors.default()); // ⚠️ یہ important ہے

app.use(express.json());
app.use("/api", routes);

export default app;
