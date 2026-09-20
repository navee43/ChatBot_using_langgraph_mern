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



import os
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from pymongo import MongoClient
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.mongodb import MongoDBSaver
from langchain_core.messages import BaseMessage
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

load_dotenv()



class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    task="text-generation",
    huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
)
chatmodel = ChatHuggingFace(llm=llm)


def chat_node(state: ChatState):
    response = chatmodel.invoke(state["messages"])
    return {"messages": [response]}


# MongoDB Atlas replaces MemorySaver: the bot's memory now survives restarts
client = MongoClient(os.getenv("MONGODB_URI"))
checkpointer = MongoDBSaver(client, db_name="chatbot_app")

graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_edge(START, "chat_node")
graph.add_edge("chat_node", END)

chatbot = graph.compile(checkpointer=checkpointer)