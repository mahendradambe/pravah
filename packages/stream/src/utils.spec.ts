import { EventStream } from "./event-stream";
import { ofType } from "./utils";

describe("utils", () => {
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

    describe("ofType", () => {
        it("should return false if the given event is not of the event type", () => {
            expect(
                ofType(TestEventType.Test1)({
                    owner: eventStream,
                    payload: false,
                    type: TestEventType.Test2,
                })
            ).toBe(false);
        });

        it("should return true if the given event is not of the event type", () => {
            expect(
                ofType(TestEventType.Test1)({
                    owner: eventStream,
                    payload: false,
                    type: TestEventType.Test1,
                })
            ).toBe(true);
        });
    });
});
