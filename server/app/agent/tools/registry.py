from typing import Callable
from app.agent.types.tool_types import ToolDefinition

_registry: dict[str, dict] = {}

def register(name: str, description: str, func: Callable, required_role: str | None = None, requires_confirmation: bool = False):
    _registry[name] = {"definition": ToolDefinition(name=name, description=description, required_role=required_role, requires_confirmation=requires_confirmation), "func": func}

def get(name: str):
    return _registry.get(name)

def list_tools() -> list[str]:
    return list(_registry.keys())

def all_definitions():
    return [v["definition"] for v in _registry.values()]
