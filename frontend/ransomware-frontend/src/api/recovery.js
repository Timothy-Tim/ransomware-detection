import { apiRequest } from "./client";

export const getRecoveryTasks = () => {
  return apiRequest("/recovery/tasks");
};

export const startRecovery = (id) => {
  return apiRequest(`/recovery/${id}/start`, {
    method: "POST",
  });
};