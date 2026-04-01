const noop = (..._args: unknown[]) => {};

export const log = __DEV__ ? console.log.bind(console) : noop;
export const warn = __DEV__ ? console.warn.bind(console) : noop;
export const error = __DEV__ ? console.error.bind(console) : noop;
