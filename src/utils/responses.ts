import type { Response } from "express";

type ResponseData = object | unknown[] | string | null;

const buildResponse = (status: number, data: ResponseData) => ({
  status,
  success: status >= 200 && status < 400,
  data,
});

const ok = <T extends ResponseData>(res: Response, data: T, status = 200) =>
  res.status(status).json(buildResponse(status, data));

const fail = (res: Response, data: ResponseData, status = 400) => {
  const payload =
    typeof data === "string"
      ? { message: data }
      : data ?? { message: "An error occurred" };
  return res.status(status).json(buildResponse(status, payload));
};

export const response = (res: Response, data: ResponseData, status = 500) => {
  if (status < 400) {
    return ok(res, data, status);
  } else {
    return fail(res, data, status);
  }
};

export const okHtml = (res: Response, html: string, status = 200) =>
  res.status(status).type("html").send(html);

export const okFile = (res: Response, filePath: string, status = 200) =>
  res.status(status).sendFile(filePath);

export const okRaw = (res: Response, data: unknown, status = 200) =>
  res.status(status).send(data);
