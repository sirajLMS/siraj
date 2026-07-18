type RefLike = {
  name: string;
  configCallbacks?: Set<unknown>;
};

type ConfigStoreLike = {
  addTypeRef: (ref: RefLike) => void;
  implementors: Map<string, unknown>;
  typeConfigs: Map<string, unknown>;
  fields: Map<string, Map<string, unknown>>;
  refs: Set<unknown>;
  paramAssociations: Map<unknown, unknown>;
  pending: boolean;
  __sirajHmrPatched?: boolean;
};

type BuilderWithConfigStore = {
  configStore: ConfigStoreLike;
};

function allowFieldReplacement(fieldMap: Map<string, unknown>): Map<string, unknown> {
  if ((fieldMap as { __sirajHmr?: boolean }).__sirajHmr) {
    return fieldMap;
  }
  (fieldMap as { __sirajHmr?: boolean }).__sirajHmr = true;
  // Skip the duplicate-field throw in ConfigStore so HMR can replace resolvers.
  fieldMap.has = () => false;
  return fieldMap;
}

function clearTypeRegistration(store: ConfigStoreLike, typeName: string, keepRef: RefLike): void {
  const existing = store.implementors.get(typeName) as RefLike | undefined;
  if (!existing || existing === keepRef) {
    return;
  }

  // Drop pending onConfig listeners on the superseded ref so a late
  // updateConfig cannot re-enter and throw Duplicate typename.
  existing.configCallbacks?.clear();

  store.implementors.delete(typeName);
  store.typeConfigs.delete(typeName);
  store.fields.delete(typeName);
  store.refs.delete(existing);
  for (const [param, resolved] of store.paramAssociations.entries()) {
    if (param === existing || resolved === typeName || resolved === existing) {
      store.paramAssociations.delete(param);
    }
  }
  // Re-open the store so field callbacks queue until the next toSchema().
  store.pending = true;
}

/**
 * Turbopack/Webpack HMR can re-evaluate Pothos definition modules while the
 * SchemaBuilder singleton survives. Pothos then throws "Duplicate typename" /
 * "Duplicate field". In development, retire the previous registration before
 * the new ref is added.
 *
 * IMPORTANT: do not wrap ref.onConfig — that re-enters during updateConfig and
 * overflows the stack.
 */
export function enablePothosDevHmr(builder: BuilderWithConfigStore): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const store = builder.configStore;
  if (store.__sirajHmrPatched) {
    return;
  }
  store.__sirajHmrPatched = true;

  const originalAddTypeRef = store.addTypeRef.bind(store);
  store.addTypeRef = (ref: RefLike) => {
    if (ref.name) {
      clearTypeRegistration(store, ref.name, ref);
    }
    return originalAddTypeRef(ref);
  };

  const originalFieldsGet = store.fields.get.bind(store.fields);
  const originalFieldsSet = store.fields.set.bind(store.fields);
  store.fields.get = (typeName: string) => {
    const fieldMap = originalFieldsGet(typeName);
    return fieldMap ? allowFieldReplacement(fieldMap) : fieldMap;
  };
  store.fields.set = (typeName: string, fieldMap: Map<string, unknown>) =>
    originalFieldsSet(typeName, allowFieldReplacement(fieldMap));
}
