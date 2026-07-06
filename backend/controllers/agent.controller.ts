import { createAgent, listAgents, topUpAgent, updateAgent } from "@backend/services/agent.service";

export const agentController = {
  listAgents,
  createAgent,
  updateAgent,
  topUpAgent
};
