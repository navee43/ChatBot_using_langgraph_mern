# import os
# from typing import TypedDict, Annotated
# from dotenv import load_dotenv
# from langgraph.graph import StateGraph, START, END
# from langgraph.graph.message import add_messages
# from langgraph.checkpoint.memory import MemorySaver
# from langchain_core.messages import BaseMessage
# from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

# load_dotenv()

# class ChatState(TypedDict):
#     messages: Annotated[list[BaseMessage], add_messages]

# llm = HuggingFaceEndpoint(
#     repo_id="meta-llama/Llama-3.1-8B-Instruct",
#     task="text-generation",
#     huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
# )
# chatmodel = ChatHuggingFace(llm=llm)

# def chat_node(state: ChatState):
#     response = chatmodel.invoke(state["messages"])
#     return {"messages": [response]}

# graph = StateGraph(ChatState)
# graph.add_node("chat_node", chat_node)
# graph.add_edge(START, "chat_node")
# graph.add_edge("chat_node", END)

# chatbot = graph.compile(checkpointer=MemorySaver())


# import os
# from typing import TypedDict, Annotated
# from dotenv import load_dotenv
# from pymongo import MongoClient
# from langgraph.graph import StateGraph, START, END
# from langgraph.graph.message import add_messages
# from langgraph.checkpoint.mongodb import MongoDBSaver
# from langgraph.prebuilt import ToolNode, tools_condition
# from langchain_core.messages import BaseMessage, SystemMessage
# from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
# from langchain_mcp_adapters.client import MultiServerMCPClient

# load_dotenv()


# class ChatState(TypedDict):
#     messages: Annotated[list[BaseMessage], add_messages]


# llm = HuggingFaceEndpoint(
#     repo_id="meta-llama/Llama-3.1-8B-Instruct",
#     task="text-generation",
#     huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
# )
# chatmodel = ChatHuggingFace(llm=llm)

# SYSTEM_PROMPT = SystemMessage(content=(
#     "You are a helpful assistant with access to tools: a web search tool "
#     "and a page-fetching tool that reads a URL's content. Use search to "
#     "find current information (news, weather, prices, facts you're unsure "
#     "of), then fetch a result's URL when you need more detail than the "
#     "search snippet gives you."
# ))

# # ---------- MCP servers ----------
# # Both run as local subprocesses (over stdio) via the Model Context
# # Protocol - no API keys needed. Building this client doesn't connect yet;
# # that happens in init_chatbot(), since MCP requires "await".
# mcp_client = MultiServerMCPClient(
#     {
#         "duckduckgo": {
#             "command": "uvx",
#             "args": ["duckduckgo-mcp-server"],
#             "transport": "stdio",
#         },
#         "fetch": {
#             "command": "uvx",
#             "args": ["mcp-server-fetch"],
#             "transport": "stdio",
#         },
#     }
# )

# # MongoDB Atlas replaces MemorySaver: the bot's memory now survives restarts
# client = MongoClient(os.getenv("MONGODB_URI"))
# checkpointer = MongoDBSaver(client, db_name="chatbot_app")

# # Filled in once by init_chatbot(), called at FastAPI startup (see server.py)
# chatbot = None


# async def init_chatbot():
#     """Connect to both MCP servers, build the tool-using graph, and compile
#     it. Call this once, at startup - not per request, since it launches
#     two subprocesses."""
#     global chatbot

#     tools = await mcp_client.get_tools()
#     llm_with_tools = chatmodel.bind_tools(tools)

#     async def chat_node(state: ChatState):
#         """LLM node that may answer directly or request a tool call."""
#         response = await llm_with_tools.ainvoke([SYSTEM_PROMPT] + state["messages"])
#         return {"messages": [response]}

#     tool_node = ToolNode(tools)

#     graph = StateGraph(ChatState)
#     graph.add_node("chat_node", chat_node)
#     graph.add_node("tools", tool_node)

#     graph.add_edge(START, "chat_node")
#     graph.add_conditional_edges("chat_node", tools_condition)
#     graph.add_edge("tools", "chat_node")

#     chatbot = graph.compile(checkpointer=checkpointer)
#     return chatbot


# def retrieve_all_threads():
#     all_threads = set()
#     for checkpoint in checkpointer.list(None):
#         all_threads.add(checkpoint.config["configurable"]["thread_id"])
#     return list(all_threads)

import os
import asyncio
import httpx
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from pymongo import MongoClient
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.mongodb import MongoDBSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_mcp_adapters.client import MultiServerMCPClient
from rag import search_uploaded_documents

load_dotenv()


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    task="text-generation",
    huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
)
chatmodel = ChatHuggingFace(llm=llm)

SYSTEM_PROMPT = SystemMessage(content=(
    "You are a helpful assistant with access to tools: a web search tool, "
    "a page-fetching tool that reads a URL's content, and a document "
    "search tool that looks inside files the user has uploaded in this "
    "conversation. Use web search for current information (news, weather, "
    "prices, facts you're unsure of), fetch a result's URL for more detail "
    "than a search snippet gives you, and the document search tool "
    "whenever the user asks about an uploaded file, 'the document', "
    "'the PDF', or similar."
))

# ---------- MCP servers ----------
# Both run as local subprocesses (over stdio) via the Model Context
# Protocol - no API keys needed. Building this client doesn't connect yet;
# that happens in init_chatbot(), since MCP requires "await".
mcp_client = MultiServerMCPClient(
    {
        "duckduckgo": {
            "command": "uvx",
            "args": ["duckduckgo-mcp-server"],
            "transport": "stdio",
        },
        "fetch": {
            "command": "uvx",
            "args": ["mcp-server-fetch"],
            "transport": "stdio",
        },
    }
)

# MongoDB Atlas replaces MemorySaver: the bot's memory now survives restarts
client = MongoClient(os.getenv("MONGODB_URI"))
checkpointer = MongoDBSaver(client, db_name="chatbot_app")

# Filled in once by init_chatbot(), called at FastAPI startup (see server.py)
chatbot = None

# Free Hugging Face endpoints occasionally drop a connection outright
# (ConnectError) rather than returning a real error - this happens
# especially right after other CPU-heavy work (like embedding an
# uploaded file) briefly ties up the machine. Retrying once or twice
# with a short pause papers over that instead of surfacing it as a
# broken chat. Genuine errors (bad auth, bad request) raise different
# exception types and are NOT retried here - they fail immediately.
RETRYABLE_EXCEPTIONS = (
    httpx.ConnectError,
    httpx.ConnectTimeout,
    httpx.ReadError,
    httpx.ReadTimeout,
    httpx.RemoteProtocolError,
)


async def _ainvoke_with_retry(runnable, messages, attempts=3, base_delay=1.5):
    for attempt in range(attempts):
        try:
            return await runnable.ainvoke(messages)
        except RETRYABLE_EXCEPTIONS:
            if attempt == attempts - 1:
                raise
            await asyncio.sleep(base_delay * (attempt + 1))


async def init_chatbot():
    """Connect to both MCP servers, build the tool-using graph, and compile
    it. Call this once, at startup - not per request, since it launches
    two subprocesses."""
    global chatbot

    mcp_tools = await mcp_client.get_tools()
    tools = mcp_tools + [search_uploaded_documents]
    llm_with_tools = chatmodel.bind_tools(tools)

    async def chat_node(state: ChatState):
        """LLM node that may answer directly or request a tool call."""
        response = await _ainvoke_with_retry(
            llm_with_tools, [SYSTEM_PROMPT] + state["messages"]
        )
        return {"messages": [response]}

    tool_node = ToolNode(tools)

    graph = StateGraph(ChatState)
    graph.add_node("chat_node", chat_node)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "chat_node")
    graph.add_conditional_edges("chat_node", tools_condition)
    graph.add_edge("tools", "chat_node")

    chatbot = graph.compile(checkpointer=checkpointer)
    return chatbot


def retrieve_all_threads():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)