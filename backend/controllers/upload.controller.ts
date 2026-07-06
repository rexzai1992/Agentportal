import { getDocumentForDownload, saveUpload } from "@backend/services/upload.service";

export const uploadController = {
  save: saveUpload,
  getForDownload: getDocumentForDownload
};
