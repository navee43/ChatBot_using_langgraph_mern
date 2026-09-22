// import { useState, useRef, useEffect } from "react";
// import "./App.css";

// function SendIcon() {
//   return (
//     <svg
//       width="18"
//       height="18"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       aria-hidden="true"
//     >
//       <path d="M22 2 11 13" />
//       <path d="M22 2 15 22l-4-9-9-4 20-7z" />
//     </svg>
//   );
// }

// function BotIcon() {
//   return (
//     <svg
//       width="18"
//       height="18"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       aria-hidden="true"
//     >
//       <rect x="4" y="8" width="16" height="12" rx="3" />
//       <path d="M12 8V4" />
//       <circle cx="12" cy="3" r="1" />
//       <circle cx="9" cy="14" r="1" />
//       <circle cx="15" cy="14" r="1" />
//     </svg>
//   );
// }

// export default function App() {
//   const [threadId] = useState(() => crypto.randomUUID());
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const bottomRef = useRef(null);

// useEffect(() => {
//   bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
// }, [messages, loading]);

// async function send() {
//   const text = input.trim();
//   if (!text || loading) return;
//   setMessages((m) => [...m, { role: "user", text }]);
//   setInput("");
//   setLoading(true);
//   try {
//     const res = await fetch("http://localhost:5000/api/chat/stream", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: text, threadId }),
//     });
//     if (!res.ok || !res.body) throw new Error("Bad response");

//     const reader = res.body.getReader();
//     const decoder = new TextDecoder();
//     let reply = "";
//     let started = false;

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       reply += decoder.decode(value, { stream: true });
//       const snapshot = reply;

//       if (!started) {
//         started = true;
//         setMessages((m) => [...m, { role: "ai", text: snapshot }]);
//       } else {
//         setMessages((m) => {
//           const copy = [...m];
//           copy[copy.length - 1] = { role: "ai", text: snapshot };
//           return copy;
//         });
//       }
//     }

//     if (!started) {
//       setMessages((m) => [...m, { role: "ai", text: "Something went wrong." }]);
//     }
//   } catch {
//     setMessages((m) => [...m, { role: "ai", text: "Could not reach the server." }]);
//   }
//   setLoading(false);
// }

//   return (
//     <div className="app">
//       <main className="chat min-h-screen flex items-center justify-center">
//         <header className="chat__header">
//           <div className="avatar avatar--bot">
//             <BotIcon />
//           </div>
//           <div className="chat__heading">
//             <h1 className="chat__title">My Chatbot</h1>
//             <p className="chat__status">
//               <span className="chat__dot" aria-hidden="true" />
//               {loading ? "Thinking..." : "Online"}
//             </p>
//           </div>
//         </header>

//         <div
//           className="chat__messages"
//           role="log"
//           aria-live="polite"
//           aria-label="Conversation"
//         >
//           {messages.length === 0 && !loading && (
//             <div className="empty">
//               <div className="avatar avatar--lg avatar--bot">
//                 <BotIcon />
//               </div>
//               <h2 className="empty__title">How can I help you today?</h2>
//               <p className="empty__text">Type a message below to start the conversation.</p>
//             </div>
//           )}

//           {messages.map((m, i) => (
//             <div key={i} className={`row row--${m.role}`}>
//               {m.role === "ai" && (
//                 <div className="avatar avatar--bot" aria-hidden="true">
//                   <BotIcon />
//                 </div>
//               )}
//               <div className={`bubble bubble--${m.role}`}>
//                 <span className="sr-only">{m.role === "user" ? "You: " : "AI: "}</span>
//                 {m.text}
//               </div>
//             </div>
//           ))}

//           {loading  && (
//             <div className="row row--ai">
//               <div className="avatar avatar--bot" aria-hidden="true">
//                 <BotIcon />
//               </div>
//               <div className="bubble bubble--ai bubble--typing" role="status">
//                 <span className="sr-only">AI is typing...</span>
//                 <span className="dot" />
//                 <span className="dot" />
//                 <span className="dot" />
//               </div>
//             </div>
//           )}
//           <div ref={bottomRef} />
//         </div>

//         <footer className="composer">
//           <label htmlFor="chat-input" className="sr-only">
//             Type your message
//           </label>
//           <input
//             id="chat-input"
//             className="composer__input"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && send()}
//             placeholder="Type here..."
//             autoComplete="off"
//           />
//           <button
//             className="composer__button"
//             onClick={send}
//             disabled={loading || !input.trim()}
//             aria-label="Send message"
//           >
//             <SendIcon />
//             <span className="composer__label">Send</span>
//           </button>
//         </footer>
//       </main>
//     </div>
//   );
// }




// import { useState, useRef, useEffect } from "react";
// import "./App.css";

// /* ---------- Session helpers ---------- */
// const EMPTY = [];

// function load(key, fallback) {
//   try {
//     const v = sessionStorage.getItem(key);
//     return v ? JSON.parse(v) : fallback;
//   } catch {
//     return fallback;
//   }
// }

// function getInitial() {
//   const threads = load("threads", []);
//   const chats = load("chats", {});
//   let active = null;
//   try {
//     active = sessionStorage.getItem("thread_id");
//   } catch {
//     /* ignore */
//   }
//   if (!active || !threads.includes(active)) {
//     active = threads[0] ?? crypto.randomUUID();
//   }
//   if (!threads.includes(active)) threads.unshift(active);
//   return { threads, chats, active };
// }

// const shortId = (id) => id.slice(0, 8);

// /* ---------- Icons ---------- */
// const iconProps = {
//   width: 18,
//   height: 18,
//   viewBox: "0 0 24 24",
//   fill: "none",
//   stroke: "currentColor",
//   strokeWidth: 2,
//   strokeLinecap: "round",
//   strokeLinejoin: "round",
//   "aria-hidden": "true",
// };

// function SendIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M22 2 11 13" />
//       <path d="M22 2 15 22l-4-9-9-4 20-7z" />
//     </svg>
//   );
// }

// function BotIcon() {
//   return (
//     <svg {...iconProps}>
//       <rect x="4" y="8" width="16" height="12" rx="3" />
//       <path d="M12 8V4" />
//       <circle cx="12" cy="3" r="1" />
//       <circle cx="9" cy="14" r="1" />
//       <circle cx="15" cy="14" r="1" />
//     </svg>
//   );
// }

// function PlusIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M12 5v14M5 12h14" />
//     </svg>
//   );
// }

// function MenuIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M4 6h16M4 12h16M4 18h16" />
//     </svg>
//   );
// }

// export default function App() {
//   const [init] = useState(getInitial);
//   const [threads, setThreads] = useState(init.threads); // list of all thread ids
//   const [chats, setChats] = useState(init.chats); // { threadId: [messages] }
//   const [threadId, setThreadId] = useState(init.active); // active thread
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const bottomRef = useRef(null);

//   const messages = chats[threadId] ?? EMPTY;

//   // Save everything in the session
//   useEffect(() => {
//     try {
//       sessionStorage.setItem("threads", JSON.stringify(threads));
//       sessionStorage.setItem("chats", JSON.stringify(chats));
//       sessionStorage.setItem("thread_id", threadId);
//     } catch {
//       /* storage may be unavailable */
//     }
//   }, [threads, chats, threadId]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
//   }, [messages, loading]);

//   // Update the messages of one specific thread
//   function updateChat(id, fn) {
//     setChats((prev) => ({ ...prev, [id]: fn(prev[id] ?? []) }));
//   }

//   function newChat() {
//     if (loading) return;
//     const id = crypto.randomUUID();
//     setThreads((t) => [id, ...t]);
//     setChats((c) => ({ ...c, [id]: [] }));
//     setThreadId(id);
//     setInput("");
//     setSidebarOpen(false);
//   }

//   function selectThread(id) {
//     if (loading || id === threadId) {
//       setSidebarOpen(false);
//       return;
//     }
//     setThreadId(id);
//     setInput("");
//     setSidebarOpen(false);
//   }

//   async function send() {
//     const text = input.trim();
//     if (!text || loading) return;
//     const id = threadId;
//     updateChat(id, (m) => [...m, { role: "user", text }]);
//     setInput("");
//     setLoading(true);
//     try {
//       const res = await fetch("http://localhost:5000/api/chat/stream", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text, threadId: id }),
//       });
//       if (!res.ok || !res.body) throw new Error("Bad response");

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder();
//       let reply = "";
//       let started = false;

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         reply += decoder.decode(value, { stream: true });
//         const snapshot = reply;

//         if (!started) {
//           started = true;
//           updateChat(id, (m) => [...m, { role: "ai", text: snapshot }]);
//         } else {
//           updateChat(id, (m) => {
//             const copy = [...m];
//             copy[copy.length - 1] = { role: "ai", text: snapshot };
//             return copy;
//           });
//         }
//       }

//       if (!started) {
//         updateChat(id, (m) => [...m, { role: "ai", text: "Something went wrong." }]);
//       }
//     } catch {
//       updateChat(id, (m) => [...m, { role: "ai", text: "Could not reach the server." }]);
//     }
//     setLoading(false);
//   }

//   return (
//     <div className="app">
//       {/* ---------- Sidebar ---------- */}
//       <aside
//         id="sidebar"
//         className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}
//         aria-label="Conversations"
//       >
//         <div className="sidebar__brand">
//           <div className="avatar avatar--bot">
//             <BotIcon />
//           </div>
//           <span className="sidebar__title">My Chatbot</span>
//         </div>

//         <button className="new-chat" onClick={newChat} disabled={loading}>
//           <PlusIcon />
//           New Chat
//         </button>

//         <h2 className="sidebar__heading">My Conversations</h2>

//         <nav className="sidebar__nav" aria-label="Conversation list">
//           <ul className="thread-list">
//             {threads.map((id) => {
//               const firstUser = (chats[id] ?? EMPTY).find((m) => m.role === "user");
//               const active = id === threadId;
//               return (
//                 <li key={id}>
//                   <button
//                     className={`thread ${active ? "thread--active" : ""}`}
//                     onClick={() => selectThread(id)}
//                     disabled={loading && !active}
//                     aria-current={active ? "true" : undefined}
//                     title={id}
//                   >
//                     <span className="thread__id">Chat {shortId(id)}</span>
//                     <span className="thread__preview">
//                       {firstUser ? firstUser.text : "No messages yet"}
//                     </span>
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         </nav>
//       </aside>

//       {sidebarOpen && (
//         <div className="backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
//       )}

//       {/* ---------- Chat window ---------- */}
//       <main className="chat">
//         <header className="chat__header">
//           <button
//             className="icon-btn menu-btn"
//             onClick={() => setSidebarOpen(true)}
//             aria-label="Open conversations"
//             aria-controls="sidebar"
//             aria-expanded={sidebarOpen}
//           >
//             <MenuIcon />
//           </button>
//           <div className="chat__heading">
//             <h1 className="chat__title">Chat {shortId(threadId)}</h1>
//             <p className="chat__status">
//               <span className="chat__dot" aria-hidden="true" />
//               {loading ? "Thinking..." : "Online"}
//             </p>
//           </div>
//         </header>

//         <div
//           className="chat__messages"
//           role="log"
//           aria-live="polite"
//           aria-label="Conversation"
//         >
//           <div className="chat__inner">
//             {messages.length === 0 && !loading && (
//               <div className="empty">
//                 <div className="avatar avatar--lg avatar--bot">
//                   <BotIcon />
//                 </div>
//                 <h2 className="empty__title">How can I help you today?</h2>
//                 <p className="empty__text">Type a message below to start the conversation.</p>
//               </div>
//             )}

//             {messages.map((m, i) => (
//               <div key={i} className={`row row--${m.role}`}>
//                 {m.role === "ai" && (
//                   <div className="avatar avatar--bot" aria-hidden="true">
//                     <BotIcon />
//                   </div>
//                 )}
//                 <div className={`bubble bubble--${m.role}`}>
//                   <span className="sr-only">{m.role === "user" ? "You: " : "AI: "}</span>
//                   {m.text}
//                 </div>
//               </div>
//             ))}

//             {loading && messages[messages.length - 1]?.role === "user" && (
//               <div className="row row--ai">
//                 <div className="avatar avatar--bot" aria-hidden="true">
//                   <BotIcon />
//                 </div>
//                 <div className="bubble bubble--ai bubble--typing" role="status">
//                   <span className="sr-only">AI is typing...</span>
//                   <span className="dot" />
//                   <span className="dot" />
//                   <span className="dot" />
//                 </div>
//               </div>
//             )}
//             <div ref={bottomRef} />
//           </div>
//         </div>

//         <footer className="composer">
//           <div className="composer__inner">
//             <label htmlFor="chat-input" className="sr-only">
//               Type your message
//             </label>
//             <input
//               id="chat-input"
//               className="composer__input"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && send()}
//               placeholder="Type here..."
//               autoComplete="off"
//             />
//             <button
//               className="composer__button"
//               onClick={send}
//               disabled={loading || !input.trim()}
//               aria-label="Send message"
//             >
//               <SendIcon />
//               <span className="composer__label">Send</span>
//             </button>
//           </div>
//         </footer>
//       </main>
//     </div>
//   );
// }



// import { useState, useRef, useEffect } from "react";
// import "./App.css";

// const API = "http://localhost:5000/api";
// const EMPTY = [];

// function getInitialThreadId() {
//   try {
//     const saved = sessionStorage.getItem("thread_id");
//     if (saved) return saved;
//   } catch {
//     /* ignore */
//   }
//   return crypto.randomUUID();
// }

// const shortId = (id) => id.slice(0, 8);

// /* ---------- Icons ---------- */
// const iconProps = {
//   width: 18,
//   height: 18,
//   viewBox: "0 0 24 24",
//   fill: "none",
//   stroke: "currentColor",
//   strokeWidth: 2,
//   strokeLinecap: "round",
//   strokeLinejoin: "round",
//   "aria-hidden": "true",
// };

// function SendIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M22 2 11 13" />
//       <path d="M22 2 15 22l-4-9-9-4 20-7z" />
//     </svg>
//   );
// }

// function BotIcon() {
//   return (
//     <svg {...iconProps}>
//       <rect x="4" y="8" width="16" height="12" rx="3" />
//       <path d="M12 8V4" />
//       <circle cx="12" cy="3" r="1" />
//       <circle cx="9" cy="14" r="1" />
//       <circle cx="15" cy="14" r="1" />
//     </svg>
//   );
// }

// function PlusIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M12 5v14M5 12h14" />
//     </svg>
//   );
// }

// function MenuIcon() {
//   return (
//     <svg {...iconProps}>
//       <path d="M4 6h16M4 12h16M4 18h16" />
//     </svg>
//   );
// }

// export default function App() {
//   const [threadId, setThreadId] = useState(getInitialThreadId); // active thread
//   const [threads, setThreads] = useState([]); // [{ threadId, title }] from MongoDB
//   const [chats, setChats] = useState({}); // { threadId: [messages] } loaded so far
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const bottomRef = useRef(null);

//   const messages = chats[threadId] ?? EMPTY;

//   // Keep the active thread in the session so a refresh returns to it
//   useEffect(() => {
//     try {
//       sessionStorage.setItem("thread_id", threadId);
//     } catch {
//       /* storage may be unavailable */
//     }
//   }, [threadId]);

//   // Load the sidebar list once when the page opens
//   useEffect(() => {
//     refreshThreads(threadId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Load a conversation from MongoDB when its thread becomes active
//   useEffect(() => {
//     if (chats[threadId] !== undefined) {
//       setHistoryLoading(false);
//       return;
//     }
//     let cancelled = false;
//     setHistoryLoading(true);
//     fetch(`${API}/threads/${encodeURIComponent(threadId)}/messages`)
//       .then((res) => {
//         if (!res.ok) throw new Error("Bad response");
//         return res.json();
//       })
//       .then((data) => {
//         if (!cancelled) setChats((c) => ({ ...c, [threadId]: data.messages ?? [] }));
//       })
//       .catch(() => {
//         if (!cancelled) {
//           setChats((c) => ({
//             ...c,
//             [threadId]: [{ role: "ai", text: "Could not load this conversation." }],
//           }));
//         }
//       })
//       .finally(() => {
//         if (!cancelled) setHistoryLoading(false);
//       });
//     return () => {
//       cancelled = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [threadId]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
//   }, [messages, loading]);

//   // Fetch saved threads. The active chat stays in the list even before its first message.
//   async function refreshThreads(activeId) {
//     try {
//       const res = await fetch(`${API}/threads`);
//       if (!res.ok) throw new Error("Bad response");
//       const data = await res.json();
//       const saved = data.threads ?? [];
//       setThreads(
//         saved.some((t) => t.threadId === activeId)
//           ? saved
//           : [{ threadId: activeId, title: "" }, ...saved]
//       );
//     } catch {
//       setThreads((prev) => (prev.length ? prev : [{ threadId: activeId, title: "" }]));
//     }
//   }

//   // Update the messages of one specific thread
//   function updateChat(id, fn) {
//     setChats((prev) => ({ ...prev, [id]: fn(prev[id] ?? []) }));
//   }

//   function newChat() {
//     if (loading || historyLoading) return;
//     // Already on an empty chat: nothing to do
//     if (chats[threadId] !== undefined && chats[threadId].length === 0) {
//       setSidebarOpen(false);
//       return;
//     }
//     const id = crypto.randomUUID();
//     setThreads((t) => [{ threadId: id, title: "" }, ...t]);
//     setChats((c) => ({ ...c, [id]: [] }));
//     setThreadId(id);
//     setInput("");
//     setSidebarOpen(false);
//   }

//   function selectThread(id) {
//     if (loading || historyLoading || id === threadId) {
//       setSidebarOpen(false);
//       return;
//     }
//     // Leaving an empty, never-used chat: remove it from the list
//     if (chats[threadId] !== undefined && chats[threadId].length === 0) {
//       setThreads((t) => t.filter((x) => x.threadId !== threadId));
//     }
//     setThreadId(id);
//     setInput("");
//     setSidebarOpen(false);
//   }

//   async function send() {
//     const text = input.trim();
//     if (!text || loading || historyLoading) return;
//     const id = threadId;
//     updateChat(id, (m) => [...m, { role: "user", text }]);
//     setInput("");
//     setLoading(true);
//     try {
//       const res = await fetch(`${API}/chat/stream`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text, threadId: id }),
//       });
//       if (!res.ok || !res.body) throw new Error("Bad response");

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder();
//       let reply = "";
//       let started = false;

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         reply += decoder.decode(value, { stream: true });
//         const snapshot = reply;

//         if (!started) {
//           started = true;
//           updateChat(id, (m) => [...m, { role: "ai", text: snapshot }]);
//         } else {
//           updateChat(id, (m) => {
//             const copy = [...m];
//             copy[copy.length - 1] = { role: "ai", text: snapshot };
//             return copy;
//           });
//         }
//       }

//       if (!started) {
//         updateChat(id, (m) => [...m, { role: "ai", text: "Something went wrong." }]);
//       }
//     } catch {
//       updateChat(id, (m) => [...m, { role: "ai", text: "Could not reach the server." }]);
//     }
//     setLoading(false);
//     refreshThreads(id); // the thread is now saved in MongoDB, so update the sidebar
//   }

//   const busy = loading || historyLoading;

//   return (
//     <div className="app">
//       {/* ---------- Sidebar ---------- */}
//       <aside
//         id="sidebar"
//         className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}
//         aria-label="Conversations"
//       >
//         <div className="sidebar__brand">
//           <div className="avatar avatar--bot">
//             <BotIcon />
//           </div>
//           <span className="sidebar__title">My Chatbot</span>
//         </div>

//         <button className="new-chat" onClick={newChat} disabled={busy}>
//           <PlusIcon />
//           New Chat
//         </button>

//         <h2 className="sidebar__heading">My Conversations</h2>

//         <nav className="sidebar__nav" aria-label="Conversation list">
//           <ul className="thread-list">
//             {threads.map((t) => {
//               const active = t.threadId === threadId;
//               return (
//                 <li key={t.threadId}>
//                   <button
//                     className={`thread ${active ? "thread--active" : ""}`}
//                     onClick={() => selectThread(t.threadId)}
//                     disabled={busy && !active}
//                     aria-current={active ? "true" : undefined}
//                     title={t.threadId}
//                   >
//                     <span className="thread__id">Chat {shortId(t.threadId)}</span>
//                     <span className="thread__preview">{t.title || "No messages yet"}</span>
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         </nav>
//       </aside>

//       {sidebarOpen && (
//         <div className="backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
//       )}

//       {/* ---------- Chat window ---------- */}
//       <main className="chat">
//         <header className="chat__header">
//           <button
//             className="icon-btn menu-btn"
//             onClick={() => setSidebarOpen(true)}
//             aria-label="Open conversations"
//             aria-controls="sidebar"
//             aria-expanded={sidebarOpen}
//           >
//             <MenuIcon />
//           </button>
//           <div className="chat__heading">
//             <h1 className="chat__title">Chat {shortId(threadId)}</h1>
//             <p className="chat__status">
//               <span className="chat__dot" aria-hidden="true" />
//               {loading ? "Thinking..." : "Online"}
//             </p>
//           </div>
//         </header>

//         <div
//           className="chat__messages"
//           role="log"
//           aria-live="polite"
//           aria-label="Conversation"
//         >
//           <div className="chat__inner">
//             {historyLoading && (
//               <div className="empty" role="status">
//                 <p className="empty__text">Loading conversation...</p>
//               </div>
//             )}

//             {messages.length === 0 && !loading && !historyLoading && (
//               <div className="empty">
//                 <div className="avatar avatar--lg avatar--bot">
//                   <BotIcon />
//                 </div>
//                 <h2 className="empty__title">How can I help you today?</h2>
//                 <p className="empty__text">Type a message below to start the conversation.</p>
//               </div>
//             )}

//             {messages.map((m, i) => (
//               <div key={i} className={`row row--${m.role}`}>
//                 {m.role === "ai" && (
//                   <div className="avatar avatar--bot" aria-hidden="true">
//                     <BotIcon />
//                   </div>
//                 )}
//                 <div className={`bubble bubble--${m.role}`}>
//                   <span className="sr-only">{m.role === "user" ? "You: " : "AI: "}</span>
//                   {m.text}
//                 </div>
//               </div>
//             ))}

//             {loading && messages[messages.length - 1]?.role === "user" && (
//               <div className="row row--ai">
//                 <div className="avatar avatar--bot" aria-hidden="true">
//                   <BotIcon />
//                 </div>
//                 <div className="bubble bubble--ai bubble--typing" role="status">
//                   <span className="sr-only">AI is typing...</span>
//                   <span className="dot" />
//                   <span className="dot" />
//                   <span className="dot" />
//                 </div>
//               </div>
//             )}
//             <div ref={bottomRef} />
//           </div>
//         </div>

//         <footer className="composer">
//           <div className="composer__inner">
//             <label htmlFor="chat-input" className="sr-only">
//               Type your message
//             </label>
//             <input
//               id="chat-input"
//               className="composer__input"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && send()}
//               placeholder="Type here..."
//               autoComplete="off"
//               disabled={historyLoading}
//             />
//             <button
//               className="composer__button"
//               onClick={send}
//               disabled={busy || !input.trim()}
//               aria-label="Send message"
//             >
//               <SendIcon />
//               <span className="composer__label">Send</span>
//             </button>
//           </div>
//         </footer>
//       </main>
//     </div>
//   );
// }



import { useState, useRef, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000/api";
const EMPTY = [];

function getInitialThreadId() {
  try {
    const saved = sessionStorage.getItem("thread_id");
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return crypto.randomUUID();
}

const shortId = (id) => id.slice(0, 8);

/* ---------- Icons ---------- */
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

function SendIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="14" r="1" />
      <circle cx="15" cy="14" r="1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.19 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48" />
    </svg>
  );
}

export default function App() {
  const [threadId, setThreadId] = useState(getInitialThreadId); // active thread
  const [threads, setThreads] = useState([]); // [{ threadId, title }] from MongoDB
  const [chats, setChats] = useState({}); // { threadId: [messages] } loaded so far
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const messages = chats[threadId] ?? EMPTY;

  // Keep the active thread in the session so a refresh returns to it
  useEffect(() => {
    try {
      sessionStorage.setItem("thread_id", threadId);
    } catch {
      /* storage may be unavailable */
    }
  }, [threadId]);

  // Load the sidebar list once when the page opens
  useEffect(() => {
    refreshThreads(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load a conversation from MongoDB when its thread becomes active
  useEffect(() => {
    if (chats[threadId] !== undefined) {
      setHistoryLoading(false);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    fetch(`${API}/threads/${encodeURIComponent(threadId)}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error("Bad response");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setChats((c) => ({ ...c, [threadId]: data.messages ?? [] }));
      })
      .catch(() => {
        if (!cancelled) {
          setChats((c) => ({
            ...c,
            [threadId]: [{ role: "ai", text: "Could not load this conversation." }],
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
  }, [messages, loading]);

  // Fetch saved threads. The active chat stays in the list even before its first message.
  async function refreshThreads(activeId) {
    try {
      const res = await fetch(`${API}/threads`);
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      const saved = data.threads ?? [];
      setThreads(
        saved.some((t) => t.threadId === activeId)
          ? saved
          : [{ threadId: activeId, title: "" }, ...saved]
      );
    } catch {
      setThreads((prev) => (prev.length ? prev : [{ threadId: activeId, title: "" }]));
    }
  }

  // Update the messages of one specific thread
  function updateChat(id, fn) {
    setChats((prev) => ({ ...prev, [id]: fn(prev[id] ?? []) }));
  }

  function newChat() {
    if (loading || historyLoading) return;
    // Already on an empty chat: nothing to do
    if (chats[threadId] !== undefined && chats[threadId].length === 0) {
      setSidebarOpen(false);
      return;
    }
    const id = crypto.randomUUID();
    setThreads((t) => [{ threadId: id, title: "" }, ...t]);
    setChats((c) => ({ ...c, [id]: [] }));
    setThreadId(id);
    setInput("");
    setSidebarOpen(false);
  }

  function selectThread(id) {
    if (loading || historyLoading || id === threadId) {
      setSidebarOpen(false);
      return;
    }
    // Leaving an empty, never-used chat: remove it from the list
    if (chats[threadId] !== undefined && chats[threadId].length === 0) {
      setThreads((t) => t.filter((x) => x.threadId !== threadId));
    }
    setThreadId(id);
    setInput("");
    setSidebarOpen(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || historyLoading) return;
    const id = threadId;
    updateChat(id, (m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId: id }),
      });
      if (!res.ok || !res.body) throw new Error("Bad response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const snapshot = reply;

        if (!started) {
          started = true;
          updateChat(id, (m) => [...m, { role: "ai", text: snapshot }]);
        } else {
          updateChat(id, (m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "ai", text: snapshot };
            return copy;
          });
        }
      }

      if (!started) {
        updateChat(id, (m) => [...m, { role: "ai", text: "Something went wrong." }]);
      }
    } catch {
      updateChat(id, (m) => [...m, { role: "ai", text: "Could not reach the server." }]);
    }
    setLoading(false);
    refreshThreads(id); // the thread is now saved in MongoDB, so update the sidebar
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || busy) return;

    const id = threadId;
    setUploading(true);
    updateChat(id, (m) => [...m, { role: "system", text: `Uploading ${file.name}...` }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("threadId", id);

      const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
      const data = await res.json();

      updateChat(id, (m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "system",
          text: res.ok
            ? `📄 ${file.name} uploaded (${data.chunks} chunks indexed) - ask me anything about it.`
            : `Could not read ${file.name}: ${data.error || "upload failed"}`,
        };
        return copy;
      });
    } catch {
      updateChat(id, (m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "system", text: `Could not upload ${file.name}.` };
        return copy;
      });
    }
    setUploading(false);
  }

  const busy = loading || historyLoading || uploading;

  return (
    <div className="app">
      {/* ---------- Sidebar ---------- */}
      <aside
        id="sidebar"
        className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}
        aria-label="Conversations"
      >
        <div className="sidebar__brand">
          <div className="avatar avatar--bot">
            <BotIcon />
          </div>
          <span className="sidebar__title">My Chatbot</span>
        </div>

        <button className="new-chat" onClick={newChat} disabled={busy}>
          <PlusIcon />
          New Chat
        </button>

        <h2 className="sidebar__heading">My Conversations</h2>

        <nav className="sidebar__nav" aria-label="Conversation list">
          <ul className="thread-list">
            {threads.map((t) => {
              const active = t.threadId === threadId;
              return (
                <li key={t.threadId}>
                  <button
                    className={`thread ${active ? "thread--active" : ""}`}
                    onClick={() => selectThread(t.threadId)}
                    disabled={busy && !active}
                    aria-current={active ? "true" : undefined}
                    title={t.threadId}
                  >
                    <span className="thread__id">Chat {shortId(t.threadId)}</span>
                    <span className="thread__preview">{t.title || "No messages yet"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ---------- Chat window ---------- */}
      <main className="chat">
        <header className="chat__header">
          <button
            className="icon-btn menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <MenuIcon />
          </button>
          <div className="chat__heading">
            <h1 className="chat__title">Chat {shortId(threadId)}</h1>
            <p className="chat__status">
              <span className="chat__dot" aria-hidden="true" />
              {loading ? "Thinking..." : uploading ? "Uploading..." : "Online"}
            </p>
          </div>
        </header>

        <div
          className="chat__messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          <div className="chat__inner">
            {historyLoading && (
              <div className="empty" role="status">
                <p className="empty__text">Loading conversation...</p>
              </div>
            )}

            {messages.length === 0 && !loading && !historyLoading && (
              <div className="empty">
                <div className="avatar avatar--lg avatar--bot">
                  <BotIcon />
                </div>
                <h2 className="empty__title">How can I help you today?</h2>
                <p className="empty__text">Type a message below to start the conversation.</p>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "system" ? (
                <div key={i} className="system-note" role="status">
                  {m.text}
                </div>
              ) : (
                <div key={i} className={`row row--${m.role}`}>
                  {m.role === "ai" && (
                    <div className="avatar avatar--bot" aria-hidden="true">
                      <BotIcon />
                    </div>
                  )}
                  <div className={`bubble bubble--${m.role}`}>
                    <span className="sr-only">{m.role === "user" ? "You: " : "AI: "}</span>
                    {m.text}
                  </div>
                </div>
              )
            )}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="row row--ai">
                <div className="avatar avatar--bot" aria-hidden="true">
                  <BotIcon />
                </div>
                <div className="bubble bubble--ai bubble--typing" role="status">
                  <span className="sr-only">AI is typing...</span>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="composer">
          <div className="composer__inner">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="composer__attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-label="Attach a file"
              title="Attach a .pdf or .txt file"
            >
              <PaperclipIcon />
            </button>

            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <input
              id="chat-input"
              className="composer__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type here..."
              autoComplete="off"
              disabled={historyLoading}
            />
            <button
              className="composer__button"
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
              <span className="composer__label">Send</span>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}