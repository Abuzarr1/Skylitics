from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class ProblemDetailsException(Exception):
    def __init__(self, status_code: int, type: str, title: str, detail: str, instance: str = None):
        self.status_code = status_code
        self.type = type
        self.title = title
        self.detail = detail
        self.instance = instance

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(ProblemDetailsException)
    async def problem_details_handler(request: Request, exc: ProblemDetailsException):
        content = {
            "type": exc.type,
            "title": exc.title,
            "status": exc.status_code,
            "detail": exc.detail
        }
        if exc.instance:
            content["instance"] = exc.instance
            
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers={"Content-Type": "application/problem+json"}
        )
