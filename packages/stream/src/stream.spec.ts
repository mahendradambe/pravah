import { Stream } from "./stream";
import { isStream } from "./utils";

describe("stream", () => {
    let stream: Stream<any>;

    beforeEach(() => {
        stream = new Stream();
        Stream.numActive = 0;
    });

    it("should be defined", () => {
        expect(stream).toBeDefined();
    });

    describe("stream.start", () => {
        it("should start the stream", async () => {
            expect(stream.ready).toBe(false);
            expect(await stream.start()).not.toBeDefined();
            expect(stream.ready).toBe(true);
            expect(Stream.numActive).toBe(1);
        });

        it("should no-op if already started", async () => {
            await stream.start();
            await stream.start();

            expect(Stream.numActive).toBe(1);
        });
    });

    describe("stream.stop", () => {
        it("should stop the stream", async () => {
            await stream.start();
            expect(Stream.numActive).toBe(1);

            await stream.stop();
            expect(Stream.numActive).toBe(0);
        });
    });

    describe("stream.subscribe", () => {
        it("should call the given subscriber whenever there's an update", () => {
            const subscriber = jest.fn();

            stream.subscribe(subscriber);
            stream.set(0);

            expect(subscriber).toBeCalledWith(0);
        });

        it("should start with a value if it already exists and the stream is running", () => {
            const subscriber = jest.fn();
            stream.set(0);
            stream.start();

            stream.subscribe(subscriber);

            expect(subscriber).toBeCalledWith(0);
        });

        it("should return a function to unsubscribe", () => {
            const subscriber = jest.fn();

            const unsub = stream.subscribe(subscriber);
            unsub();
            stream.set(0);

            expect(subscriber).toBeCalledTimes(0);
        });
    });

    describe("stream.unsubscribe", () => {
        it("should cancel the subscription for given subscriber", () => {
            const subscriber = jest.fn();

            stream.subscribe(subscriber);
            stream.set(0);
            stream.unsubscribe(subscriber);
            stream.set(1);

            expect(subscriber).toBeCalledTimes(1);
            expect(subscriber).not.toBeCalledWith(1);
        });
    });

    describe("stream.plug", () => {
        it("should accept another stream and merge it's events", () => {
            const subscriber = jest.fn();
            const another = new Stream();
            stream.subscribe(subscriber);

            stream.plug(another);
            another.set(0);

            expect(subscriber).toBeCalledWith(0);
            expect(Stream.numActive).toBe(1);
        });
    });

    describe("stream.unplug", () => {
        it("should unplug an already plugged stream", () => {
            const subscriber = jest.fn();
            const another = new Stream();
            stream.subscribe(subscriber);
            stream.plug(another);

            stream.unplug(another);
            another.set(0);

            expect(subscriber).not.toBeCalled();
            expect(Stream.numActive).toBe(1);
        });
    });

    describe("isStream", () => {
        it("should return false if the given argument is not stream like", () => {
            expect(isStream(null)).toBe(false);
        });

        it("should return true if the given argument is stream like", () => {
            expect(isStream(new Stream())).toBe(true);
        });
    });
});
