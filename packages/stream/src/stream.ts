import { createAdapter } from "@most/adapter";
import {
    chain,
    combineArray,
    concatMap,
    filter,
    join,
    map,
    mergeArray,
    multicast,
    now,
    runEffects,
    tap,
    until,
} from "@most/core";
import { ToStreamsArray } from "@most/core/dist/combinator/variadic";
import { asap, newDefaultScheduler } from "@most/scheduler";
import { Disposable, Scheduler, Sink, Stream as MostStream } from "@most/types";
import { noop } from "@pravah/utils";
import { Listener } from "./types";
import { isMostStream } from "./utils";

export const scheduler = newDefaultScheduler();

export class Stream<T> {
    static nextId = 0;
    static numActive = 0;
    id = Stream.nextId++;
    stream: MostStream<T>;
    value: T = undefined;
    ready = false;
    private _hasValue = false;

    private _running = false;
    private _startPromise: Promise<void>;
    private _stopPromise: Promise<void>;
    private _stopStream: (event: undefined) => void;
    private _subscribers: Array<(x: T) => void> = [];

    set: (value: T) => void;
    plug: <T = any>(stream: MostStream<T>) => void;
    unplug: <T = any>(stream: MostStream<T>) => void;

    constructor(s?: MostStream<T> | T) {
        const [stop, stop$] = createAdapter<undefined>();
        const [induce, stream$] = createAdapter<T>();
        const [plugStream, plugStream$] = createAdapter();
        this._stopStream = stop;
        const pluggedStreams = new Map<MostStream<any>, MostStream<any>>();
        const unplugStreams = new Map<
            MostStream<any>,
            (event: undefined) => void
        >();

        this.set = (v) => {
            this.value = v;
            induce(v);
        };

        this.plug = <T = any>(stream: MostStream<T>) => {
            const [unplug, unplug$] = createAdapter<undefined>();
            pluggedStreams.set(stream, until(unplug$, stream));
            unplugStreams.set(stream, unplug);
            plugStream(void 0);
        };

        this.unplug = <T = any>(stream: MostStream<T>) => {
            unplugStreams.get(stream)?.(void 0);
            unplugStreams.delete(stream);
            pluggedStreams.delete(stream);
        };

        let stream;

        if (isMostStream(s)) {
            stream = s;
        } else {
            stream = map(() => this.value, now(s));
            this.value = s;
            this._hasValue = true;
        }

        const pluggedStreams$ = join(
            map(
                () => mergeArray(Array.from(pluggedStreams.values())),
                plugStream$
            )
        );

        const eventStream = mergeArray([stream, stream$, pluggedStreams$]);

        this.stream = multicast(
            tap(this.runListeners.bind(this), until(stop$, eventStream))
        );
    }

    run(sink: Sink<T>, s: Scheduler): Disposable {
        return this.stream.run(sink, s);
    }

    private runListeners(value: T) {
        this.value = value;
        this._hasValue = true;
        for (const listener of this._subscribers) {
            listener(value);
        }
    }

    subscribe(run: Listener<T>): () => void {
        if (this._running && this._hasValue) {
            run(this.value);
        }

        this._subscribers.push(run);
        if (!this._running) {
            this.start();
        }
        return () => {
            const index = this._subscribers.indexOf(run);
            if (index !== -1) this._subscribers.splice(index, 1);
        };
    }

    unsubscribe(run: Listener<T>) {
        const index = this._subscribers.indexOf(run);
        if (index !== -1) this._subscribers.splice(index, 1);
    }

    async start(): Promise<void> {
        if (!this._running) {
            Stream.numActive++;

            this._stopPromise = new Promise((resolve) => {
                runEffects(this.stream, scheduler).then(() => {
                    resolve();
                    Stream.numActive--;
                });
            });

            this._running = true;
            this._startPromise = new Promise<void>((resolve, reject) => {
                asap(
                    {
                        run: () => {
                            this.ready = true;
                            resolve();
                        },
                        error: reject,
                        dispose: noop,
                    },
                    scheduler
                );
            });
        }
        return this._startPromise;
    }

    stop(): Promise<void> {
        this._stopStream(undefined);
        this._running = false;

        return this._stopPromise;
    }

    map<U>(f: (a: T) => U): Stream<U> {
        return new Stream(map(f, this));
    }

    tap(f: (a: T) => void): Stream<T> {
        return new Stream(tap(f, this));
    }

    concatMap<B>(f: (a: T) => Stream<B>): Stream<B> {
        return new Stream(concatMap(f, this));
    }

    chain<B>(f: (a: T) => Stream<B>): Stream<B> {
        return new Stream(chain(f, this));
    }

    filter(p: (a: T) => boolean): Stream<T> {
        return new Stream(filter(p, this));
    }

    static combineArray<Args extends unknown[], R>(
        fn: (...args: Args) => R,
        streams: ToStreamsArray<Args>
    ): Stream<R> {
        return new Stream(combineArray(fn, streams));
    }

    static mergeArray<S extends MostStream<any>[]>(streams: S) {
        return new Stream(mergeArray(streams));
    }

    static of<T>(s?: MostStream<T> | T): Stream<T> {
        return new Stream(s);
    }
}
