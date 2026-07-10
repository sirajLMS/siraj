import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";

export type OrchestrateSeedManyOptions<TSpec, TEntity, TKey> = {
  specs: TSpec[];
  toKey: (spec: TSpec) => TKey;
  findExisting: (keys: TKey[]) => Promise<Map<TKey, TEntity>>;
  createMany: (toCreate: TSpec[]) => Promise<TEntity[]>;
  refetchOnRace?: (keys: TKey[]) => Promise<Map<TKey, TEntity>>;
};

export async function orchestrateSeedMany<TSpec, TEntity, TKey>(
  options: OrchestrateSeedManyOptions<TSpec, TEntity, TKey>
): Promise<TEntity[]> {
  const { specs, toKey, findExisting, createMany, refetchOnRace } = options;
  if (specs.length === 0) return [];

  const keys = specs.map(toKey);
  const existingMap = await findExisting(keys);
  const toCreate = specs.filter(spec => !existingMap.has(toKey(spec)));

  if (toCreate.length === 0) {
    return [...existingMap.values()];
  }

  let created: TEntity[];
  try {
    created = await createMany(toCreate);
  } catch (error) {
    if (!isDuplicateError(error) || !refetchOnRace) throw error;
    const raceKeys = toCreate.map(toKey);
    const refetched = await refetchOnRace(raceKeys);
    created = raceKeys.map(key => refetched.get(key)).filter((entity): entity is TEntity => entity != null);
  }

  return [...existingMap.values(), ...created];
}
