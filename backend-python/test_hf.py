import asyncio
import os
from dotenv import load_dotenv
from huggingface_hub import AsyncInferenceClient

load_dotenv()


async def test():
    token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    print("Token loaded:", bool(token))

    client = AsyncInferenceClient(token=token)
    resp = await client.chat_completion(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[{"role": "user", "content": "Say hello in one word."}],
        max_tokens=20,
    )
    print(resp.choices[0].message.content)


asyncio.run(test())