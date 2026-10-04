import {
  createSession,
  deleteSessionRecordById,
  deleteSessionsByUserId,
  rehashSessionRecord,
  updateSession,
} from "@/backend/db/repo/shared/session.repository.mutations";
import {
  findLatestSessionByUserId,
  findSessionByHmacHash,
  findSessionByLegacyHash,
  findSessionRecordById,
  getSessionConfigByRole,
  upsertSessionConfigRecord,
} from "@/backend/db/repo/shared/session.repository.queries";
import {
  countActiveUserSessions,
  fetchSessionTTL,
  fetchUserSessionMetadata,
  patchRedisSessionData,
  readSessionGroupSimulation,
  removeSessionGroupSimulation,
  validateSession,
  writeSessionGroupSimulation,
} from "@/backend/db/repo/shared/session.repository.sessions";

export { setSessionRedisServiceFactory } from "@/backend/db/repo/shared/session.repository.redis";

export namespace SessionRepository {
  export const getSessionConfig = getSessionConfigByRole;
  export const upsertSessionConfig = upsertSessionConfigRecord;
  export const findSessionById = findSessionRecordById;
  export const findByUserId = findLatestSessionByUserId;
  export const create = createSession;
  export const update = updateSession;
  export const deleteSessionById = deleteSessionRecordById;
  export const deleteByUserId = deleteSessionsByUserId;
  export const validate = validateSession;
  export const findByHmacHash = findSessionByHmacHash;
  export const findByLegacyHash = findSessionByLegacyHash;
  export const rehashSession = rehashSessionRecord;
  export const getUserSessionMetadata = fetchUserSessionMetadata;
  export const countUserSessions = countActiveUserSessions;
  export const getSessionTTL = fetchSessionTTL;
  export const updateRedisSessionData = patchRedisSessionData;
  export const getSessionGroupSimulation = readSessionGroupSimulation;
  export const setSessionGroupSimulation = writeSessionGroupSimulation;
  export const clearSessionGroupSimulation = removeSessionGroupSimulation;
}
