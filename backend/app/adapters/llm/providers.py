from __future__ import annotations

import json
import time
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

import httpx
from openai import AsyncOpenAI

from app.adapters.llm.types import ProviderProbeResult
from app.core.config import Settings, get_settings
from app.core.feature_flags import ProviderConfig, ProviderId


class BaseLLMProvider(ABC):
    provider_id: ProviderId

    def __init__(self, settings: Settings, config: ProviderConfig) -> None:
        self.settings = settings
        self.config = config

    @abstractmethod
    def is_configured(self) -> bool:
        ...

    def chat_model(self) -> str:
        return self.config.chat_model or self._default_chat_model()

    def embedding_model(self) -> str:
        return self.config.embedding_model or self._default_embedding_model()

    @abstractmethod
    def _default_chat_model(self) -> str:
        ...

    @abstractmethod
    def _default_embedding_model(self) -> str:
        ...

    @abstractmethod
    async def chat_complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> str:
        ...

    @abstractmethod
    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        if False:
            yield ""
        raise NotImplementedError

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        ...

    @abstractmethod
    async def ping(self) -> tuple[bool, float | None, str | None]:
        ...

    async def probe(
        self,
        *,
        active_for_chat: bool,
        active_for_embedding: bool,
    ) -> ProviderProbeResult:
        configured = self.is_configured()
        ok = False
        latency_ms: float | None = None
        error: str | None = None
        if configured and self.config.enabled:
            ok, latency_ms, error = await self.ping()
        return ProviderProbeResult(
            provider=self.provider_id,
            configured=configured,
            enabled=self.config.enabled,
            active_for_chat=active_for_chat,
            active_for_embedding=active_for_embedding,
            ok=ok,
            latency_ms=latency_ms,
            model=self.chat_model() if active_for_chat else self.embedding_model(),
            error=error,
        )


class OpenAICompatibleProvider(BaseLLMProvider):
    """OpenAI, Ollama, and Grok share the same chat/embed API shape."""

    provider_id: ProviderId

    def __init__(
        self,
        settings: Settings,
        config: ProviderConfig,
        *,
        api_key: str,
        base_url: str | None = None,
        extra_chat_kwargs: dict | None = None,
    ) -> None:
        super().__init__(settings, config)
        self._api_key = api_key
        self._base_url = base_url
        self._extra_chat_kwargs = extra_chat_kwargs or {}
        self._client: AsyncOpenAI | None = None

    def is_configured(self) -> bool:
        if self.provider_id == "ollama":
            return bool(self._base_url)
        return bool(self._api_key)

    def _client_instance(self) -> AsyncOpenAI:
        if self._client is None:
            kwargs: dict = {"api_key": self._api_key or "ollama"}
            if self._base_url:
                kwargs["base_url"] = self._base_url
            self._client = AsyncOpenAI(**kwargs)
        return self._client

    async def chat_complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> str:
        client = self._client_instance()
        response = await client.chat.completions.create(
            model=self.chat_model(),
            messages=messages,  # type: ignore[arg-type]
            max_tokens=max_tokens,
            temperature=temperature,
            **self._extra_chat_kwargs,
        )
        return (response.choices[0].message.content or "").strip()

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        client = self._client_instance()
        stream = await client.chat.completions.create(
            model=self.chat_model(),
            messages=messages,  # type: ignore[arg-type]
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
            **self._extra_chat_kwargs,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token

    async def embed(self, texts: list[str]) -> list[list[float]]:
        client = self._client_instance()
        response = await client.embeddings.create(
            input=texts,
            model=self.embedding_model(),
        )
        return [item.embedding for item in response.data]

    async def ping(self) -> tuple[bool, float | None, str | None]:
        client = self._client_instance()
        start = time.perf_counter()
        try:
            await client.chat.completions.create(
                model=self.chat_model(),
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
                temperature=0,
                **self._extra_chat_kwargs,
            )
            return True, round((time.perf_counter() - start) * 1000, 1), None
        except Exception as exc:
            return False, None, str(exc)


class OpenAIProvider(OpenAICompatibleProvider):
    provider_id: ProviderId = "openai"

    def __init__(self, settings: Settings, config: ProviderConfig) -> None:
        super().__init__(
            settings,
            config,
            api_key=settings.openai_api_key,
            extra_chat_kwargs=_phi_safe_chat_kwargs(settings),
        )

    def _default_chat_model(self) -> str:
        return self.settings.openai_chat_model

    def _default_embedding_model(self) -> str:
        return "text-embedding-3-small"


class OllamaProvider(OpenAICompatibleProvider):
    provider_id = "ollama"

    def __init__(self, settings: Settings, config: ProviderConfig) -> None:
        super().__init__(
            settings,
            config,
            api_key="ollama",
            base_url=settings.ollama_base_url.rstrip("/"),
        )

    def _default_chat_model(self) -> str:
        return "llama3.2"

    def _default_embedding_model(self) -> str:
        return "nomic-embed-text"


class GrokProvider(OpenAICompatibleProvider):
    provider_id = "grok"

    def __init__(self, settings: Settings, config: ProviderConfig) -> None:
        super().__init__(
            settings,
            config,
            api_key=settings.grok_api_key,
            base_url=settings.grok_base_url.rstrip("/"),
        )

    def _default_chat_model(self) -> str:
        return "grok-2-latest"

    def _default_embedding_model(self) -> str:
        return "text-embedding-3-small"


class GeminiProvider(BaseLLMProvider):
    provider_id = "gemini"
    _API_BASE = "https://generativelanguage.googleapis.com/v1beta"

    def is_configured(self) -> bool:
        return bool(self.settings.gemini_api_key)

    def _default_chat_model(self) -> str:
        return "gemini-2.0-flash"

    def _default_embedding_model(self) -> str:
        return "text-embedding-004"

    def _to_gemini_contents(self, messages: list[dict[str, str]]) -> tuple[str | None, list[dict]]:
        system_parts: list[str] = []
        contents: list[dict] = []
        for message in messages:
            role = message["role"]
            text = message["content"]
            if role == "system":
                system_parts.append(text)
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": text}]})
        system_instruction = "\n\n".join(system_parts) if system_parts else None
        return system_instruction, contents

    async def chat_complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> str:
        system_instruction, contents = self._to_gemini_contents(messages)
        payload: dict = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": temperature,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
        data = await self._post(f"models/{self.chat_model()}:generateContent", payload)
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Unexpected Gemini response shape") from exc

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        system_instruction, contents = self._to_gemini_contents(messages)
        payload: dict = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": temperature,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        url = (
            f"{self._API_BASE}/models/{self.chat_model()}:streamGenerateContent"
            f"?key={self.settings.gemini_api_key}&alt=sse"
        )
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    body = line[6:].strip()
                    if not body or body == "[DONE]":
                        continue
                    event = json.loads(body)
                    try:
                        part = event["candidates"][0]["content"]["parts"][0]
                        token = part.get("text", "")
                        if token:
                            yield token
                    except (KeyError, IndexError, TypeError):
                        continue

    async def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            payload = {
                "model": f"models/{self.embedding_model()}",
                "content": {"parts": [{"text": text}]},
            }
            data = await self._post(f"models/{self.embedding_model()}:embedContent", payload)
            vectors.append(data["embedding"]["values"])
        return vectors

    async def ping(self) -> tuple[bool, float | None, str | None]:
        start = time.perf_counter()
        try:
            await self.chat_complete(
                [{"role": "user", "content": "ping"}],
                max_tokens=1,
                temperature=0,
            )
            return True, round((time.perf_counter() - start) * 1000, 1), None
        except Exception as exc:
            return False, None, str(exc)

    async def _post(self, path: str, payload: dict) -> dict:
        url = f"{self._API_BASE}/{path}?key={self.settings.gemini_api_key}"
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()


def _phi_safe_chat_kwargs(settings: Settings) -> dict:
    if not settings.openai_zero_data_retention:
        return {}
    return {"store": False}


def build_provider(provider_id: ProviderId, config: ProviderConfig) -> BaseLLMProvider:
    settings = get_settings()
    if provider_id == "openai":
        return OpenAIProvider(settings, config)
    if provider_id == "ollama":
        return OllamaProvider(settings, config)
    if provider_id == "grok":
        return GrokProvider(settings, config)
    if provider_id == "gemini":
        return GeminiProvider(settings, config)
    raise ValueError(f"Unsupported provider: {provider_id}")
