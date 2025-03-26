import { ValueOrArray } from '../types';

export const toArray = <T>(value: ValueOrArray<T>): T[] =>
  Array.isArray(value) ? value : [value];
