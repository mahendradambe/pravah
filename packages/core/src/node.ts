import { EventStream, selectPayload, Stream } from "@pravah/stream";
import { ParamPort } from "./param-port";
import { ResultPort } from "./result-port";
import {
    MetadataEventType,
    NodeData,
    NodeDefinition,
    NodeEvents,
    NodeEventType,
    NodeMeta,
    NodeType,
    ParamData,
    ParamPortType,
    PortEventType,
    ProcedureType,
    Provider,
    ReadyEventType,
    ResultDefinition,
    ResultPortType,
} from "./types";
import { applyArgs, argsToArray, spreadArgs } from "./utils";

const token = "core:node";

class CoreNode extends EventStream<NodeEvents> implements NodeType {
    paramPorts: Map<number, ParamPortType> = new Map();
    resultPorts: Map<string, ResultPortType> = new Map();
    id: string;
    cache?: any;

    private _started: boolean = false;
    private _meta: Record<string, any> = {};
    private _active: boolean = false;
    private _execution$: Stream<any>;

    constructor(
        data: NodeData,
        public readonly definition: NodeDefinition,
        public readonly owner: ProcedureType
    ) {
        super([
            NodeEventType.AfterProcess,
            NodeEventType.BeforeProcess,
            ReadyEventType.OnReady,
            NodeEventType.ParamPortsAdded,
            NodeEventType.ResultPortsAdded,
            NodeEventType.ActivityChanged,
            MetadataEventType.OnMetadataUpdate,
        ]);
        this.id = data.id;
        this._meta = data.meta;
        this.cache = data.cache;

        const param$ = this.getEventStream(NodeEventType.ParamPortsAdded).map(
            selectPayload
        );

        const initialArgs$ = param$
            .map((params) =>
                params.map(
                    (param) =>
                        [param.order, param.value] satisfies [number, any]
                )
            )
            .map(spreadArgs);

        const updatedArgs$ = param$
            .chain((params) =>
                Stream.combineArray(
                    argsToArray,
                    params.map((param) =>
                        param
                            .getEventStream(PortEventType.OnUpdate)
                            .map(
                                (event) =>
                                    [
                                        event.owner.order,
                                        event.payload,
                                    ] satisfies [number, any]
                            )
                    )
                )
            )
            .map(spreadArgs);

        const args$ = Stream.mergeArray([initialArgs$, updatedArgs$]);
        const activity$ = this.getEventStream(
            NodeEventType.ActivityChanged
        ).map(selectPayload);

        const argsBuffer$ = Stream.combineArray(argsToArray, [args$, activity$])
            .filter(([, active]) => active as boolean)
            .map(([args]) => args as any[]);

        const processResult$ = argsBuffer$
            .tap((args) => this.emit(NodeEventType.BeforeProcess, args))
            .map(applyArgs(this.definition.process.bind(this)))
            .tap((returnValue) => {
                this.cache = returnValue;
                this.emit(NodeEventType.AfterProcess, returnValue);
            });

        const resultPorts$ = this.getEventStream(
            NodeEventType.ResultPortsAdded
        ).map(selectPayload);

        this._execution$ = Stream.combineArray(argsToArray, [
            processResult$,
            resultPorts$,
        ]).tap(([result, resultPorts]: [any, ResultPortType[]]) => {
            resultPorts.forEach((resultPort) => {
                resultPort.send(result);
            });
        });

        this._initPorts();
    }

    get started() {
        return this._started;
    }

    updateMeta(setter: (meta: NodeMeta) => NodeMeta) {
        this._meta = setter(this._meta);

        if (this._started) {
            this.emit(MetadataEventType.OnMetadataUpdate, this._meta);
        }
    }

    get active() {
        return this._active;
    }

    get meta() {
        return this._meta;
    }

    activate() {
        if (this._started) {
            this._active = true;
            this.emit(NodeEventType.ActivityChanged, true);
        }
    }

    deactivate() {
        this._active = false;

        if (this._started) {
            this.emit(NodeEventType.ActivityChanged, false);
        }
    }

    serialize(): NodeData {
        return {
            id: this.id,
            name: this.definition.name,
            type: this.definition.type,
            params: Array.from(this.paramPorts.values()).map((port) =>
                port.serialize()
            ),
            results: Array.from(this.resultPorts.values()).map((paramPort) =>
                paramPort.serialize()
            ),
            returnType: this.definition.returnType,
            cache: this.cache,
            meta: this.meta,
        };
    }

    start() {
        this.updateMeta(() => this.meta);

        this.paramPorts.forEach((port) => {
            this.stream$.plug(port.stream$);
        });
        this.resultPorts.forEach((port) => {
            this.stream$.plug(port.stream$);
        });

        this.stream$.plug(this._execution$);

        const paramsList = Array.from(this.paramPorts.values());
        const resultsList = Array.from(this.resultPorts.values());
        this.emit(NodeEventType.ParamPortsAdded, paramsList);
        this.emit(NodeEventType.ResultPortsAdded, resultsList);
        this.emit(ReadyEventType.OnReady, this);

        this._started = true;
    }

    stop(): void {
        this.paramPorts.forEach((port) => {
            this.stream$.unplug(port.stream$);
        });
        this.resultPorts.forEach((port) => {
            this.stream$.unplug(port.stream$);
        });
        this.stream$.unplug(this._execution$);

        this.deactivate();
        this._started = false;
    }

    addParam<T = any>(data: ParamData<T>): ParamPortType {
        const param = new ParamPort(data, this);
        this.paramPorts.set(param.order, param);

        if (this._started) {
            this.stream$.plug(param.stream$);

            this.emit(
                NodeEventType.ParamPortsAdded,
                Array.from(this.paramPorts.values())
            );
        }

        return param;
    }

    addResult<T = any>(definition: ResultDefinition<T>) {
        const result = new ResultPort(definition, this);
        this.resultPorts.set(result.alias, result);

        if (this._started) {
            this.stream$.plug(result.stream$);

            this.emit(
                NodeEventType.ResultPortsAdded,
                Array.from(this.resultPorts.values())
            );
        }

        return result;
    }

    getParam(order: any): ParamPortType<any> | null {
        return this.paramPorts.get(order) ?? null;
    }

    getResult(alias: string): ResultPortType<any> | null{
        return this.resultPorts.get(alias) ?? null;
    }

    private _initPorts() {
        if (!Array.isArray(this.definition.params)) {
            this.definition.params = [];
        }
        if (!Array.isArray(this.definition.results)) {
            this.definition.results = [];
        }
        this.definition.params.forEach(this.addParam.bind(this));
        this.definition.results.forEach(this.addResult.bind(this));
    }
}

export const Node: Provider = {
    type: CoreNode,
    token,
};

export const NodeToken = token;
