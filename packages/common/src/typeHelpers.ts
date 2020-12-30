export type EventMap = Record<string, any>;

export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void | boolean;
