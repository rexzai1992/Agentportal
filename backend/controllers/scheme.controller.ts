import {
  addSchemeRevision,
  createScheme,
  createSchemeBinding,
  getScheme,
  listSchemeBindings,
  listSchemes,
  updateSchemeStatus
} from "@backend/services/scheme.service";

export const schemeController = {
  list: listSchemes,
  create: createScheme,
  detail: getScheme,
  updateStatus: updateSchemeStatus,
  addRevision: addSchemeRevision,
  listBindings: listSchemeBindings,
  createBinding: createSchemeBinding
};
