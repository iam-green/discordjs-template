export type ValueOrArray<T> = T | T[];

export type NonNull<T> = Exclude<T, null | undefined>;
