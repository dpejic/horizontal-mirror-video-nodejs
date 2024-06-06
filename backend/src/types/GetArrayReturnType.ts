export type GetArrayReturnType<T> = T extends () => (infer U)[] ? U : never;
