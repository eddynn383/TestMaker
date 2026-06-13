import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "16MB" } }).onUploadComplete(
    async ({ file }) => {
      return { url: file.ufsUrl, name: file.name };
    }
  ),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
