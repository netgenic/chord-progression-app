export type RuntimeRecord = Readonly<Record<PropertyKey, unknown>>;

export const isRuntimeRecord = (value: unknown): value is RuntimeRecord =>
  typeof value === 'object' && value !== null;

export const hasExactOwnKeys = (
  value: RuntimeRecord,
  expectedKeys: readonly PropertyKey[],
): boolean => {
  const actualKeys = Reflect.ownKeys(value);

  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
};
