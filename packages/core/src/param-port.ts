import { Port } from "./port";
import {
    NodeType,
    ParamData,
    ParamDefinition,
    ParamPortType,
    PortEventType,
} from "./types";

export class ParamPort<T = any> extends Port implements ParamPortType<T> {
    order: number;
    alias: string | undefined;
    value: T;

    constructor(data: ParamDefinition<T>, public readonly node: NodeType) {
        super(data.type);
        this.order = data.order;
        this.alias = data.alias;
        this.value = data.value!;
    }

    serialize(): ParamData<any> {
        return {
            type: this.type,
            order: this.order,
            value: this.value,
            alias: this.alias,
        };
    }

    receive(value: any) {
        this.value = value;
        this.emit(PortEventType.OnUpdate, value);
    }
}
