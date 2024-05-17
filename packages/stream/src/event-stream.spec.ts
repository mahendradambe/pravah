import { EventStream } from "./event-stream";
import { Stream } from "./stream";

describe("event-stream", () => {
    enum TestEventType {
        Test1 = "test1",
        Test2 = "test2",
    }

    type TestEvents = {
        [TestEventType.Test1]: true;
        [TestEventType.Test2]: false;
    };

    let eventStream: EventStream<TestEvents>;

    beforeEach(() => {
        eventStream = new EventStream<TestEvents>([
            TestEventType.Test1,
            TestEventType.Test2,
        ]);
    });

    describe("EventStream", () => {
        it("should be defined", () => {
            expect(eventStream).toBeDefined();
        });

        describe("eventStream.emit", () => {
            it("should not emit anything for non-existing event", () => {
                const subscriber = jest.fn();
                eventStream.stream$.subscribe(subscriber);

                // @ts-expect-error
                eventStream.emit("nonRegisteredEvents", true);

                expect(subscriber).not.toBeCalled();
            });
        });

        describe("eventStream.subscribe", () => {
            it("should subscribe to a given event", () => {
                const subscriber = jest.fn();

                eventStream.subscribe(TestEventType.Test1, subscriber);
                eventStream.emit(TestEventType.Test1, true);

                expect(subscriber).toBeCalledWith({
                    owner: eventStream,
                    payload: true,
                    type: TestEventType.Test1,
                });
            });

            it("should not invoke subscriber if event isn't found", () => {
                const subscriber = jest.fn();

                // @ts-expect-error
                eventStream.subscribe("badEvent", subscriber);
                // @ts-expect-error
                eventStream.emit("badEvent", null);

                expect(subscriber).not.toBeCalled();
            });
        });

        describe("eventStream.unsubscribe", () => {
            it("should subscribe to a given event", () => {
                const subscriber = jest.fn();

                eventStream.subscribe(TestEventType.Test1, subscriber);
                eventStream.unsubscribe(TestEventType.Test1, subscriber);
                eventStream.emit(TestEventType.Test1, true);

                expect(subscriber).not.toBeCalled();
            });
        });

        describe("eventStream.getEventStream", () => {
            it("should return null if the event isn't registered", () => {
                expect(
                    // @ts-expect-error
                    eventStream.getEventStream("nonRegisteredEvents")
                ).toBeNull();
            });

            it("should return the event stream if registered", () => {
                expect(
                    eventStream.getEventStream(TestEventType.Test1)
                ).toBeInstanceOf(Stream);
            });
        });

        describe("eventStream.getEventStreams", () => {
            it("should return only the registered event after merging", () => {
                expect(
                    eventStream.getEventStreams([
                        TestEventType.Test1,
                        // @ts-expect-error
                        "nonRegisteredEvents",
                    ])
                ).toBeInstanceOf(Stream);
            });

            it("should return merged stream of all the events if nothing is queried", () => {
                expect(eventStream.getEventStreams()).toBeInstanceOf(Stream);
            });
        });
    });
});
