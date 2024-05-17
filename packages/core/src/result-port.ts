import { identity } from "@pravah/utils";
import { Port } from "./port";
import {
    NodeType,
    PortEventType,
    ResultData,
    ResultDefinition,
    ResultPortType,
} from "./types";

export class ResultPort<T = any> extends Port implements ResultPortType<T> {
    alias: string;
    selector?: <V>(value: T) => V;

    constructor(data: ResultDefinition<T>, public readonly node: NodeType) {
        super(data.type);
        this.alias = data.alias;
        this.selector = data.selector ?? identity;
    }

    serialize(): ResultData<any> {
        return {
            alias: this.alias,
            type: this.type,
        };
    }

    send(value: any) {
        this.emit(PortEventType.OnUpdate, this.selector?.(value) ?? value);
    }
}
