import { createAdapter } from "@most/adapter";
import { Stream as MostStream } from "@most/types";
import { Stream } from "./stream";
import { Events, Listener, Event } from "./types";

export class EventStream<TEvents extends Events> {
    stream$: Stream<Event<TEvents[keyof TEvents], this>>;

    constructor(events: (keyof TEvents)[]) {
        const streamAdapters = new Map<
            keyof TEvents,
            StreamAdapter<Event<TEvents[keyof TEvents], this>>
        >();

        events.forEach((eventType) => {
            const [induce, stream] =
                createAdapter<Event<TEvents[keyof TEvents], this>>();
            streamAdapters.set(eventType, [induce, Stream.of(stream)]);
        });

        const streams = Array.from(streamAdapters.values()).map(
            (adapters) => adapters[1]
        );

        this.stream$ = Stream.mergeArray(streams);

        this._streamAdapters = streamAdapters;
    }

    emit<EventType extends keyof TEvents>(
        type: EventType,
        payload?: TEvents[EventType]
    ) {
        const [induce] = this._streamAdapters.get(type) ?? [];
        if (induce) {
            induce({ type: type as string, payload, owner: this });
        }
    }

    getEventStreams(types?: (keyof TEvents)[]) {
        const streams = Array.isArray(types)
            ? (types
                  .map(this.getEventStream.bind(this))
                  .filter(Boolean) as MostStream<any>[])
            : Array.from(this._streamAdapters.values()).map(
                  ([, stream$]) => stream$
              );
        return Stream.mergeArray(streams);
    }

    getEventStream<EventType extends keyof TEvents>(type: EventType) {
        const [, events$] = this._streamAdapters.get(type) ?? [null, null];
        return events$ as Stream<Event<TEvents[EventType], this>>;
    }

    subscribe<EventType extends keyof TEvents, Owner extends this>(
        type: EventType,
        listener: (event: Event<TEvents[keyof TEvents], Owner>) => void
    ) {
        const [, stream$] = this._streamAdapters.get(type) ?? [];
        if (stream$) {
            const unsubscribe = stream$.subscribe(listener);

            let eventUnsubs = this._subscriptions.get(type);
            if (!eventUnsubs) {
                eventUnsubs = new Map();
                this._subscriptions.set(type, eventUnsubs);
            }
            eventUnsubs.set(listener, unsubscribe);
        }
    }

    unsubscribe<EventType extends keyof TEvents, Owner extends this>(
        type: EventType,
        listener: (event: Event<TEvents[keyof TEvents], Owner>) => void
    ) {
        const eventUnsubs = this._subscriptions.get(type);
        if (eventUnsubs) {
            const unsub = eventUnsubs.get(listener);
            unsub?.();
        }
    }

    private _subscriptions: Map<
        keyof TEvents,
        Map<Listener<unknown>, () => void>
    > = new Map();

    private _streamAdapters: Map<
        keyof TEvents,
        StreamAdapter<Event<TEvents[keyof TEvents], this>>
    >;
}

type StreamAdapter<A> = [(event: A) => void, Stream<A>];
