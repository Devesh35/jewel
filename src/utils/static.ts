import fs from "fs";
import path from "path";

export const getStaticFilePath = (fileName: string) => {
  const candidatePaths = [
    path.resolve(__dirname, "..", "..", "assets", fileName),
    path.resolve(process.cwd(), "src", "assets", fileName),
    path.resolve(process.cwd(), "dist", "assets", fileName),
  ];
  return candidatePaths.find((filePath) => fs.existsSync(filePath));
};
