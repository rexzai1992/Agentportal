import {
  createAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  listAnnouncements,
  updateAnnouncement
} from "@backend/services/announcement.service";

export const announcementController = {
  list: listAnnouncements,
  create: createAnnouncement,
  update: updateAnnouncement,
  remove: deleteAnnouncement,
  active: getActiveAnnouncements
};
