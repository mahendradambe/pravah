import { EventStream, selectPayload, Stream } from "@pravah/stream";
import {
    ConnectionData,
    ConnectionEvents,
    ConnectionMeta,
    ConnectionType,
    MetadataEventType,
    ParamPortType,
    PortEventType,
    ResultPortType,
} from "./types";

export class Connection
    extends EventStream<ConnectionEvents>
    implements ConnectionType
{
    id: string;
    paramPort: ParamPortType
    resultPort: ResultPortType
    private _meta: ConnectionMeta;

    private _forwardValue$: Stream<any>;

    constructor(
        paramPort: ParamPortType,
        resultPort: ResultPortType,
        data?: Partial<ConnectionData>
    ) {
        super([MetadataEventType.OnMetadataUpdate]);
        this.paramPort = paramPort
        this.resultPort = resultPort
        this.id = data?.id ?? createConnectionId(paramPort, resultPort);
        this._meta = data?.meta ?? {};

        this._forwardValue$ = this.resultPort
            .getEventStream(PortEventType.OnUpdate)
            .map(selectPayload)
            .tap(this.pass.bind(this));
    }

    get meta() {
        return this._meta;
    }

    updateMeta(setter: (meta: ConnectionMeta) => ConnectionMeta) {
        this._meta = setter(this._meta);
        this.emit(MetadataEventType.OnMetadataUpdate, this._meta);
    }

    serialize(): ConnectionData {
        return {
            id: this.id,
            param: this.paramPort.order,
            result: this.resultPort.alias,
            source: this.resultPort.node.id,
            target: this.paramPort.node.id,
            meta: this.meta,
        };
    }

    start() {
        this.stream$.plug(this._forwardValue$);
    }

    stop(): void {
        this.stream$.unplug(this._forwardValue$);
    }

    pass(value: any) {
        this.paramPort.receive(value);
    }
}

const createConnectionId = (
    paramPort: ParamPortType,
    resultPort: ResultPortType
) =>
    `${paramPort.node.id}:${paramPort.order}-${resultPort.node.id}:${resultPort.alias}`;
