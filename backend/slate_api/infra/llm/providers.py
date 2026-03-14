from __future__ import annotations

from dataclasses import dataclass

from slate_api.core.config import settings


class LLMGatewayError(Exception):
    pass


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    display_name: str
    api_key: str
    base_url: str
    models: tuple[str, ...]

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.base_url and self.models)

    @property
    def default_model(self) -> str | None:
        return self.models[0] if self.models else None


def list_provider_specs() -> list[ProviderSpec]:
    return [
        ProviderSpec(
            name=name,
            display_name=str(raw["display_name"]),
            api_key=str(raw["api_key"] or ""),
            base_url=str(raw["base_url"] or ""),
            models=tuple(raw["models"]),
        )
        for name, raw in settings.llm_provider_specs.items()
    ]


def resolve_provider(provider_name: str | None, model_name: str | None = None) -> tuple[ProviderSpec, str]:
    specs = {spec.name: spec for spec in list_provider_specs()}
    candidates = [provider_name, settings.llm_default_provider] if provider_name else [settings.llm_default_provider]

    for candidate in candidates:
        spec = specs.get(candidate or "")
        if spec and spec.configured:
            model = model_name or spec.default_model
            if not model:
                raise LLMGatewayError(f"provider {spec.name} 没有可用模型")
            return spec, model

    for spec in specs.values():
        if spec.configured:
            model = model_name or spec.default_model
            if model:
                return spec, model

    raise LLMGatewayError("当前没有已配置的模型 provider")
