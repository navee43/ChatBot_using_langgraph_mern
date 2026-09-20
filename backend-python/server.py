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



from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from chatbot import chatbot

app = FastAPI()


class ChatRequest(BaseModel):
    message: str
    thread_id: str


@app.post("/chat")
def chat(req: ChatRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    result = chatbot.invoke(
        {"messages": [HumanMessage(content=req.message)]},
        config=config,
    )
    return {"reply": result["messages"][-1].content}


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    config = {"configurable": {"thread_id": req.thread_id}}

    def generate():
        for chunk, meta in chatbot.stream(
            {"messages": [HumanMessage(content=req.message)]},
            config=config,
            stream_mode="messages",
        ):
            if chunk.content and meta.get("langgraph_node") == "chat_node":
                yield chunk.content

    return StreamingResponse(generate(), media_type="text/plain")


# NEW: read one conversation back from MongoDB (used when you click a thread)
@app.get("/history/{thread_id}")
def history(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = chatbot.get_state(config)
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