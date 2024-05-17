import { EventStream } from "@pravah/stream";
import { NodeType, PortEvents, PortEventType } from "./types";

export abstract class Port extends EventStream<PortEvents> {
    constructor(public readonly type: string) {
        super([PortEventType.OnUpdate]);
    }

    abstract node: NodeType;
}
