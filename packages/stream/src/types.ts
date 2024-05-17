import { Stream as MostStream } from "@most/types";

export type Listener<T> = (value: T) => void;

export type Event<T, M = unknown> = { type: string; payload: T; owner: M };

export type Events = {
    [key: string]: any;
};
