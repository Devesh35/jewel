import { Router } from "express";

import { okFile, okHtml } from "../../utils/responses";
import { getStaticFilePath } from "../../utils/static";

export const welcomeRoute = Router();

welcomeRoute.get("/", (_req, res) => {
  const welcomeFilePath = getStaticFilePath("html/welcome.html");
  if (welcomeFilePath) return okFile(res, welcomeFilePath);

  return okHtml(res, "<h1>Welcome to server</h1>");
});
