class AgentError(Exception):
    pass

class PlanningError(AgentError):
    pass

class ToolNotFoundError(AgentError):
    pass

class ToolExecutionError(AgentError):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code

class PermissionDeniedError(AgentError):
    pass

class ValidationError(AgentError):
    pass

class ConfirmationRequiredError(AgentError):
    def __init__(self, message: str, pending_action: dict):
        super().__init__(message)
        self.pending_action = pending_action

class BackendError(AgentError):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code
