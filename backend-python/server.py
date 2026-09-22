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



from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
import chatbot as chatbot_module


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
        # Same filter as before: chat_node runs once to decide whether to
        # call a tool (and, with this model, that pass can come out as raw
        # text like "<function=...>...</function>"), then a second time
        # to write the real answer after the tool result comes back. A
        # real answer never starts with "<", so a short lookahead tells
        # the two apart before anything reaches the browser.
        buffer = ""
        visible = False
        LOOKAHEAD = 3

        async for chunk, meta in chatbot_module.chatbot.astream(
            {"messages": [HumanMessage(content=req.message)]},
            config=config,
            stream_mode="messages",
        ):
            node = meta.get("langgraph_node")

            if node == "tools":
                buffer = ""
                visible = False
                continue

            if node != "chat_node" or not chunk.content:
                continue

            if visible:
                yield chunk.content
                continue

            buffer += chunk.content
            stripped = buffer.lstrip()

            if stripped.startswith("<"):
                continue

            if len(stripped) >= LOOKAHEAD:
                visible = True
                yield buffer

        if buffer and not visible and not buffer.lstrip().startswith("<"):
            yield buffer

    return StreamingResponse(generate(), media_type="text/plain")


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