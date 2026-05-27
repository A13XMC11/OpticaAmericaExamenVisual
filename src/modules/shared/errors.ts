export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} no encontrado`, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("No autorizado", "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Sin permisos para esta acción", "FORBIDDEN", 403);
  }
}

export function toErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  return "Error inesperado";
}
