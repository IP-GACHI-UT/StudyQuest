type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: unknown,
) {
  const body: ErrorBody = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return Response.json(body, { status });
}
