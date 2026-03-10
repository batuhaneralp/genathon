"""
OpenAI API yardimci fonksiyonlari.
"""
import json
import asyncio
from openai import AsyncOpenAI
from config import OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS

_client = None
_semaphore = asyncio.Semaphore(3)  # Ayni anda en fazla 3 istek
import os


from dotenv import load_dotenv
load_dotenv()
api_key=os.getenv("OPENAI_API_KEY")

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI()  # OPENAI_API_KEY env'den okunur
    return _client


async def call_llm(system_prompt: str, user_prompt: str, json_mode: bool = True) -> dict | str:
    """
    OpenAI API'ye tek bir cagri yapar.
    json_mode=True ise JSON response parse eder.
    """
    kwargs = {
        "model": OPENAI_MODEL,
        "temperature": OPENAI_TEMPERATURE,
        "max_tokens": OPENAI_MAX_TOKENS,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    async with _semaphore:
        response = await get_client().chat.completions.create(**kwargs)
        await asyncio.sleep(10)  # Rate limit icin bekleme
    content = response.choices[0].message.content

    if json_mode:
        return json.loads(content)
    return content


async def call_llm_batch(calls: list[tuple[str, str]], json_mode: bool = True) -> list[dict | str]:
    """
    Birden fazla LLM cagrisini paralel yapar.
    calls: [(system_prompt, user_prompt), ...]
    """
    tasks = [call_llm(sys_p, usr_p, json_mode) for sys_p, usr_p in calls]
    return await asyncio.gather(*tasks)
