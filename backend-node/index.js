// import express from "express";
// import cors from "cors";

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message, threadId } = req.body;
//     const r = await fetch("http://localhost:8000/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message, thread_id: threadId }),
//     });
//     const data = await r.json();
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: "Chatbot service failed" });
//   }
// });

// app.listen(5000, () => console.log("Express on 5000"));

// app.post("/api/chat/stream", async (req, res) => {
//   const controller = new AbortController();
//   res.on("close", () => controller.abort());

//   try {
//     const { message, threadId } = req.body;
//     const r = await fetch("http://localhost:8000/chat/stream", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message, thread_id: threadId }),
//       signal: controller.signal,
//     });

//     if (!r.ok || !r.body) {
//       return res.status(502).json({ error: "Chatbot service failed" });
//     }

//     res.setHeader("Content-Type", "text/plain; charset=utf-8");
//     res.setHeader("Cache-Control", "no-cache");
//     res.flushHeaders();

//     for await (const chunk of r.body) {
//       res.write(chunk);
//     }
//     res.end();
//   } catch (err) {
//     if (!res.headersSent) res.status(500).json({ error: "Chatbot service failed" });
//     else res.end();
//   }
// });



// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";


// dotenv.config({
//   path: "../.env",
// });

// const app = express();
// app.use(cors());
// app.use(express.json());

// console.log("the url is",process.env.MONGODB_URI);


// const PYTHON_URL = process.env.PYTHON_URL || "http://localhost:8000";

// /* ---------- Database ---------- */
// try {
//   await mongoose.connect(process.env.MONGODB_URI, { dbName: "chatbot_app" });
//   console.log("MongoDB connected");
// } catch (err) {
//   console.error("MongoDB connection failed:", err.message);
//   process.exit(1);
// }

// // One document per conversation. The messages themselves live in Python's checkpoints.
// const threadSchema = new mongoose.Schema(
//   {
//     threadId: { type: String, required: true, unique: true },
//     title: { type: String, default: "" },
//   },
//   { timestamps: true }
// );
// const Thread = mongoose.model("Thread", threadSchema);

// /* ---------- Thread list (sidebar) ---------- */
// app.get("/api/threads", async (req, res) => {
//   try {
//     const threads = await Thread.find()
//       .sort({ updatedAt: -1 })
//       .select("threadId title -_id")
//       .lean();
//     res.json({ threads });
//   } catch (err) {
//     res.status(500).json({ error: "Could not load threads" });
//   }
// });

// /* ---------- One conversation's messages ---------- */
// app.get("/api/threads/:threadId/messages", async (req, res) => {
//   try {
//     const r = await fetch(
//       `${PYTHON_URL}/history/${encodeURIComponent(req.params.threadId)}`
//     );
//     if (!r.ok) return res.status(502).json({ error: "Chatbot service failed" });
//     res.json(await r.json());
//   } catch (err) {
//     res.status(500).json({ error: "Could not load messages" });
//   }
// });

// /* ---------- Chat (non-streaming) ---------- */
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message, threadId } = req.body;
//     const r = await fetch(`${PYTHON_URL}/chat`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message, thread_id: threadId }),
//     });
//     const data = await r.json();
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: "Chatbot service failed" });
//   }
// });

// /* ---------- Chat (streaming) ---------- */
// app.post("/api/chat/stream", async (req, res) => {
//   const { message, threadId } = req.body;
//   if (!message || !threadId) {
//     return res.status(400).json({ error: "message and threadId are required" });
//   }

//   const controller = new AbortController();
//   res.on("close", () => controller.abort());

//   try {
//     // Save the thread the first time it gets a message; title = start of that message
//     await Thread.updateOne(
//       { threadId },
//       { $setOnInsert: { title: message.trim().slice(0, 40) } },
//       { upsert: true }
//     );

//     const r = await fetch(`${PYTHON_URL}/chat/stream`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message, thread_id: threadId }),
//       signal: controller.signal,
//     });

//     if (!r.ok || !r.body) {
//       return res.status(502).json({ error: "Chatbot service failed" });
//     }

//     res.setHeader("Content-Type", "text/plain; charset=utf-8");
//     res.setHeader("Cache-Control", "no-cache");
//     res.flushHeaders();

//     for await (const chunk of r.body) {
//       res.write(chunk);
//     }
//     res.end();
//   } catch (err) {
//     if (!res.headersSent) res.status(500).json({ error: "Chatbot service failed" });
//     else res.end();
//   }
// });

// app.listen(5000, () => console.log("Express on 5000"));



import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config({
  path: "../.env",
});

// Holds the uploaded file in memory just long enough to forward it to
// Python - nothing is written to disk here. 10MB is plenty for a resume
// or a short PDF/text file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const PYTHON_URL = process.env.PYTHON_URL || "http://localhost:8000";

/* ---------- Database ---------- */
try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "chatbot_app" });
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}

// One document per conversation. The messages themselves live in Python's checkpoints.
const threadSchema = new mongoose.Schema(
  {
    threadId: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
  },
  { timestamps: true }
);
const Thread = mongoose.model("Thread", threadSchema);

/* ---------- Thread list (sidebar) ---------- */
app.get("/api/threads", async (req, res) => {
  try {
    const threads = await Thread.find()
      .sort({ updatedAt: -1 })
      .select("threadId title -_id")
      .lean();
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: "Could not load threads" });
  }
});

/* ---------- One conversation's messages ---------- */
app.get("/api/threads/:threadId/messages", async (req, res) => {
  try {
    const r = await fetch(
      `${PYTHON_URL}/history/${encodeURIComponent(req.params.threadId)}`
    );
    if (!r.ok) return res.status(502).json({ error: "Chatbot service failed" });
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: "Could not load messages" });
  }
});

/* ---------- File upload (for RAG) ---------- */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const { threadId } = req.body;
    if (!threadId) {
      return res.status(400).json({ error: "threadId is required" });
    }

    // Re-wrap the file as multipart/form-data for Python. Node's built-in
    // fetch/FormData/Blob (no extra package needed) handle this.
    const form = new FormData();
    form.append("file", new Blob([req.file.buffer]), req.file.originalname);
    form.append("thread_id", threadId);

    const r = await fetch(`${PYTHON_URL}/upload`, { method: "POST", body: form });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ---------- Chat (non-streaming) ---------- */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, threadId } = req.body;
    const r = await fetch(`${PYTHON_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, thread_id: threadId }),
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Chatbot service failed" });
  }
});

/* ---------- Chat (streaming) ---------- */
app.post("/api/chat/stream", async (req, res) => {
  const { message, threadId } = req.body;
  if (!message || !threadId) {
    return res.status(400).json({ error: "message and threadId are required" });
  }

  const controller = new AbortController();
  res.on("close", () => controller.abort());

  try {
    // Save the thread the first time it gets a message; title = start of that message
    await Thread.updateOne(
      { threadId },
      { $setOnInsert: { title: message.trim().slice(0, 40) } },
      { upsert: true }
    );

    const r = await fetch(`${PYTHON_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, thread_id: threadId }),
      signal: controller.signal,
    });

    if (!r.ok || !r.body) {
      return res.status(502).json({ error: "Chatbot service failed" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();

    for await (const chunk of r.body) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: "Chatbot service failed" });
    else res.end();
  }
});

app.listen(5000, () => console.log("Express on 5000"));