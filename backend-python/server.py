# from fastapi import FastAPI
# from pydantic import BaseModel
# from langchain_core.messages import HumanMessage
# from chatbot import chatbot
# from fastapi.responses import StreamingResponse

# app = FastAPI()

# class ChatRequest(BaseModel):
#     message: str
#     thread_id: str

# @app.post("/chat")
# def chat(req: ChatRequest):
#     config = {"configurable": {"thread_id": req.thread_id}}
#     result = chatbot.invoke(
#         {"messages": [HumanMessage(content=req.message)]},
#         config=config,
#     )
#     return {"reply": result["messages"][-1].content}


# @app.post("/chat/stream")
# def chat_stream(req: ChatRequest):
#     config = {"configurable": {"thread_id": req.thread_id}}

#     def generate():
#         for chunk, meta in chatbot.stream(
#             {"messages": [HumanMessage(content=req.message)]},
#             config=config,
#             stream_mode="messages",
#         ):
#             if chunk.content and meta.get("langgraph_node") == "chat_node":
#                 yield chunk.content

#     return StreamingResponse(generate(), media_type="text/plain")



# from contextlib import asynccontextmanager
# from fastapi import FastAPI
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# from langchain_core.messages import HumanMessage
# import chatbot as chatbot_module


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Connects to the MCP server once, when uvicorn starts, and keeps that
#     # connection open for the life of the process - not reopened per request.
#     await chatbot_module.init_chatbot()
#     yield


# app = FastAPI(lifespan=lifespan)


# class ChatRequest(BaseModel):
#     message: str
#     thread_id: str


# @app.post("/chat")
# async def chat(req: ChatRequest):
#     config = {"configurable": {"thread_id": req.thread_id}}
#     result = await chatbot_module.chatbot.ainvoke(
#         {"messages": [HumanMessage(content=req.message)]},
#         config=config,
#     )
#     return {"reply": result["messages"][-1].content}


# @app.post("/chat/stream")
# async def chat_stream(req: ChatRequest):
#     config = {"configurable": {"thread_id": req.thread_id}}

#     async def generate():
#         # Same filter as before: chat_node runs once to decide whether to
#         # call a tool (and, with this model, that pass can come out as raw
#         # text like "<function=...>...</function>"), then a second time
#         # to write the real answer after the tool result comes back. A
#         # real answer never starts with "<", so a short lookahead tells
#         # the two apart before anything reaches the browser.
#         buffer = ""
#         visible = False
#         LOOKAHEAD = 3

#         async for chunk, meta in chatbot_module.chatbot.astream(
#             {"messages": [HumanMessage(content=req.message)]},
#             config=config,
#             stream_mode="messages",
#         ):
#             node = meta.get("langgraph_node")

#             if node == "tools":
#                 buffer = ""
#                 visible = False
#                 continue

#             if node != "chat_node" or not chunk.content:
#                 continue

#             if visible:
#                 yield chunk.content
#                 continue

#             buffer += chunk.content
#             stripped = buffer.lstrip()

#             if stripped.startswith("<"):
#                 continue

#             if len(stripped) >= LOOKAHEAD:
#                 visible = True
#                 yield buffer

#         if buffer and not visible and not buffer.lstrip().startswith("<"):
#             yield buffer

#     return StreamingResponse(generate(), media_type="text/plain")


# # Read one conversation back from MongoDB (used when you click a thread)
# @app.get("/history/{thread_id}")
# async def history(thread_id: str):
#     config = {"configurable": {"thread_id": thread_id}}
#     state = await chatbot_module.chatbot.aget_state(config)
#     raw = state.values.get("messages", []) if state.values else []

#     out = []
#     for m in raw:
#         if m.type == "human":
#             role = "user"
#         elif m.type == "ai":
#             role = "ai"
#         else:
#             continue
#         if m.content:
#             out.append({"role": role, "text": m.content})
#     return {"messages": out}

import asyncio
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from langchain_core.messages import HumanMessage
import chatbot as chatbot_module
import rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connects to the MCP server once, when uvicorn starts, and keeps that
    # connection open for the life of the process - not reopened per request.
    await chatbot_module.init_chatbot()
    yield


app = FastAPI(lifespan=lifespan)


class ChatRequest(BaseModel):
    message: str
    thread_id: str


# Matches a complete "<function=name>...arguments...</function>" block,
# and also a trailing one that never got a closing tag (a cut-off or
# hallucinated extra tool call tacked onto an otherwise normal answer -
# this is what was leaking into the UI as raw "...}</function>" text).
_CLOSED_TAG_RE = re.compile(r"<function\b[^>]*>.*?</function>", re.DOTALL)
_UNCLOSED_TAG_RE = re.compile(r"<function\b.*$", re.DOTALL)


def strip_tool_markup(text: str) -> str:
    text = _CLOSED_TAG_RE.sub("", text)
    text = _UNCLOSED_TAG_RE.sub("", text)
    return text.strip()


@app.post("/chat")
async def chat(req: ChatRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    result = await chatbot_module.chatbot.ainvoke(
        {"messages": [HumanMessage(content=req.message)]},
        config=config,
    )
    return {"reply": result["messages"][-1].content}


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    config = {"configurable": {"thread_id": req.thread_id}}

    async def generate():
        # chat_node runs once each time it decides whether to call a tool,
        # and with this model that "decision" text can come out looking
        # like almost anything (raw tool-call markup in varying shapes) -
        # guessing at the text pattern turned out to be unreliable. So
        # instead of inspecting the text, we use the graph's own structure:
        # whatever chat_node produces right before a "tools" node runs was
        # a tool-call request, not an answer - throw it away. The graph
        # only reaches the end of the stream once chat_node produces a
        # message with no tool call left to make, so whatever is left
        # over when the stream finishes is the genuine final answer.
        pending = ""

        async for chunk, meta in chatbot_module.chatbot.astream(
            {"messages": [HumanMessage(content=req.message)]},
            config=config,
            stream_mode="messages",
        ):
            node = meta.get("langgraph_node")

            if node == "tools":
                pending = ""
                continue

            if node != "chat_node" or not chunk.content:
                continue

            pending += chunk.content

        # The final message is usually clean, but this model sometimes
        # tacks a hallucinated "<function=...>...</function>" fragment
        # onto the end of an otherwise normal answer (not a real tool
        # call - tools_condition didn't route it as one, so it never hit
        # the "tools" node above, and just sat in .content as junk text).
        # Strip that out before showing anything.
        pending = strip_tool_markup(pending)
        if not pending:
            pending = "I wasn't able to come up with a clear answer to that - could you rephrase?"

        # Reveal the final answer word by word so it still feels like
        # streaming, even though (unlike before) nothing is shown while
        # tools are running - only once we know it's safe to show.
        words = pending.split(" ")
        for i, word in enumerate(words):
            yield word if i == 0 else " " + word
            await asyncio.sleep(0.02)

    return StreamingResponse(generate(), media_type="text/plain")


# Ingest an uploaded file: extract its text, chunk it, and store it in the
# vector store tagged with this conversation's thread_id.
@app.post("/upload")
async def upload(file: UploadFile = File(...), thread_id: str = Form(...)):
    raw = await file.read()
    try:
        # Embedding + chunking is CPU-bound, so it runs in a thread pool -
        # otherwise it would block other requests (like a streaming chat)
        # while it works.
        chunk_count = await run_in_threadpool(
            rag.ingest_file, file.filename, raw, thread_id
        )
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    return {"filename": file.filename, "chunks": chunk_count}


# Read one conversation back from MongoDB (used when you click a thread)
@app.get("/history/{thread_id}")
async def history(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = await chatbot_module.chatbot.aget_state(config)
    raw = state.values.get("messages", []) if state.values else []

    out = []
    for m in raw:
        if m.type == "human":
            role = "user"
        elif m.type == "ai":
            role = "ai"
        else:
            continue
        if m.content:
            out.append({"role": role, "text": m.content})
    return {"messages": out}