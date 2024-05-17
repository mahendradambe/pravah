import { EventStream } from "@pravah/stream";
import { Connection } from "./connection";
import { getDefaultNodeMeta, getDefaultProcedureMeta } from "./helpers";
import {
    ConnectionData,
    ConnectionType,
    ContainerType,
    MetadataEventType,
    NodeData,
    NodeType,
    ParamPortType,
    ProcedureData,
    ProcedureEventType,
    ProcedureEvents,
    ProcedureMeta,
    ProcedureType,
    ReadyEventType,
    ResultPortType,
} from "./types";

export class Procedure
    extends EventStream<ProcedureEvents>
    implements ProcedureType
{
    private _meta: Record<string, any> = {};
    private _nodes: Map<string, NodeType> = new Map();
    private _connections: Map<string, ConnectionType> = new Map();
    private _started: boolean = false;
    private _active: boolean = false;
    private _data: ProcedureData | undefined;

    get meta() {
        return { ...this._meta };
    }

    get started() {
        return this._started;
    }

    get active() {
        return this._active;
    }

    constructor(
        public readonly container: ContainerType,
        public readonly id: string,
        data?: ProcedureData
    ) {
        super([
            ReadyEventType.OnReady,
            ProcedureEventType.Connected,
            ProcedureEventType.Disconnected,
            ProcedureEventType.NodeAdded,
            ProcedureEventType.NodeRemoved,
            ProcedureEventType.ProcedureActivityChanged,
            MetadataEventType.OnMetadataUpdate,
        ]);
        this._data = data;
        this.updateMeta(() => data?.meta ?? getDefaultProcedureMeta());
    }

    start() {
        this.stream$.start();
        this.updateMeta(() => this.meta);
        this._data?.nodes.forEach((data) => {
            this.addNode(data);
        });

        this._data?.connections.forEach((connection) => {
            const result = this.getNode(connection.source)?.getResult(
                connection.result
            );
            const param = this.getNode(connection.target)?.getParam(
                connection.param
            );
            if (result && param) {
                this.connect(param, result, connection);
            }
        });

        this._connections.forEach((connection) => {
            this.stream$.plug(connection.stream$);
            connection.start();
        });

        this._nodes.forEach((node) => {
            this.stream$.plug(node.stream$);
            node.start();
        });

        this.emit(ReadyEventType.OnReady);
        this._started = true;
    }

    stop(): void {
        this._connections.forEach((connection) => {
            connection.stop();
            this.stream$.unplug(connection.stream$);
        });

        this._nodes.forEach((node) => {
            node.stop();
            this.stream$.unplug(node.stream$);
        });
        this._started = false;
    }

    activate(): void {
        this._nodes.forEach((node) => {
            node.activate();
        });
        this._active = true;
        this.emit(ProcedureEventType.ProcedureActivityChanged, true);
    }

    deactivate(): void {
        this._nodes.forEach((node) => {
            node.deactivate();
        });
        this._active = false;
        this.emit(ProcedureEventType.ProcedureActivityChanged, false);
    }

    connect(
        param: ParamPortType,
        result: ResultPortType,
        data: Partial<ConnectionData>
    ) {
        const connection = new Connection(param, result, data);
        this._connections.set(connection.id, connection);

        if (this.started) {
            this.stream$.plug(connection.stream$);
            connection.start();
        }

        this.emit(ProcedureEventType.Connected, connection);
        return connection;
    }

    addNode(data: Partial<NodeData>) {
        const node = this.container.createNode(data, this);
        if (!node) {
            return null;
        }
        if (this._started) {
            this.stream$.plug(node.stream$);
            node.start();
        }

        if (this._active) {
            node.activate();
        }

        this._nodes.set(node.id, node);

        node.updateMeta(
            () => data.meta ?? getDefaultNodeMeta(node.definition.name)
        );

        this.emit(ProcedureEventType.NodeAdded, node);
        return node;
    }

    getNode(id: string): NodeType | null {
        return this._nodes.get(id) ?? null;
    }

    getConnection(id: string): ConnectionType | null {
        return this._connections.get(id) ?? null;
    }

    removeNode(id: string): void {
        const node = this.getNode(id);
        if (node) {
            node.stop();
            this.stream$.unplug(node.stream$);
            this._nodes.delete(id);
            this.emit(ProcedureEventType.NodeRemoved, id);
        }
    }

    disconnect(id: string): void {
        const connection = this.getConnection(id);
        if (connection) {
            connection.stop();
            this.stream$.unplug(connection.stream$);
            this._connections.delete(id);
            this.emit(ProcedureEventType.Disconnected, id);
        }
    }

    updateMeta(setter: (meta: ProcedureMeta) => ProcedureMeta) {
        this._meta = setter(this._meta);
        this.emit(MetadataEventType.OnMetadataUpdate, this._meta);
    }

    serialize(): ProcedureData {
        return {
            id: this.id,
            connections: Array.from(this._connections.values()).map(
                (connection) => connection.serialize()
            ),
            nodes: Array.from(this._nodes.values()).map((node) =>
                node.serialize()
            ),
            meta: this.meta,
        };
    }
}
