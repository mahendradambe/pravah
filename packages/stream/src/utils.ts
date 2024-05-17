import { Stream as MostStream } from "@most/types";
import { Stream } from "./stream";
import { Events, Event } from "./types";

export const isMostStream = <T>(
    s: MostStream<T> | unknown
): s is MostStream<T> => {
    return s && typeof s === "object" && (s as Stream<T>).run !== undefined;
};

export const isStream = <T>(s: Stream<T> | unknown): s is Stream<T> => {
    return (
        (s as Stream<T>)?.id !== undefined &&
        (s as Stream<T>)?.run !== undefined
    );
};

export function ofType<
    TEvents extends Events,
    TEventType extends keyof TEvents = keyof TEvents
>(type: TEventType) {
    return function (
        event: Event<TEvents[keyof TEvents]>
    ): event is Event<TEvents[TEventType]> {
        return type === event.type;
    };
}

export const selectPayload = <T>(event: Event<T>) => event.payload;

export const selectOwner = <T, M>(event: Event<T, M>) => event.owner;
