import { EventStream } from "@pravah/stream";

export type Constructible<T> = new (...args: any[]) => T;

export type Typed<T extends new (...args: any[]) => any> = T & { type: string };

export type TypedConstructible<T> = Typed<Constructible<T>>;

export interface Provider<T extends any = any> {
    token: string;
    type: Constructible<T>;
}

export enum ReadyEventType {
    OnReady = "onReady",
}

export type ReadyEvents<T> = {
    [ReadyEventType.OnReady]: T;
};

export interface Serializable<TData extends Record<string, any>> {
    serialize(): TData;
}

export interface Startable {
    start(): void;
}

export interface Stoppable {
    stop(): void;
}

export interface Disposable {
    dispose(): void;
}

export interface Activatable {
    activate(): void;
    deactivate(): void;
}

export interface Metadata<Data extends Record<string, any>> {
    meta: Data;
}

export interface UpdateMetadata<Data extends Record<string, any>> {
    updateMeta: (setter: (meta: Data) => Data | undefined) => void;
}

export enum MetadataEventType {
    OnMetadataUpdate = "onMetadataUpdate",
}

export type MetadataEvents<
    Data extends Record<string, any> = Record<string, any>
> = {
    [MetadataEventType.OnMetadataUpdate]: Data;
};

export interface ValueType<T, S> {
    type: string;
    serialize: (value: T) => S;
    deserialize: (data: S) => T;
    morph: <B>(other: B) => B | any | undefined;
}

export enum PortEventType {
    OnUpdate = "onUpdate",
}

export type PortEvents = {
    [PortEventType.OnUpdate]: any;
};

export interface ParamData<T> {
    type: string;
    order: number;
    alias: string | undefined;
    value: T | undefined;
}

export interface ParamPortType<T = any>
    extends EventStream<PortEvents>,
        Serializable<ParamData<T>> {
    type: string;
    order: number;
    alias: string | undefined;
    node: NodeType;
    value: T | undefined;
    receive(value: T): void;
}

export type ParamDefinition<T> = ParamData<T>;

export interface ResultData<T> {
    type: string;
    alias: string;
}
export interface ResultPortType<T = any>
    extends EventStream<PortEvents>,
        Serializable<ResultData<T>> {
    type: string;
    alias: string;
    node: NodeType;
    selector?: <V>(value: T) => V;
    send: (value: T) => void;
}

export type ResultDefinition<T> = ResultData<T> & {
    selector?: <V>(value: T) => V;
};
export interface ConnectionData extends Metadata<ConnectionMeta> {
    id: string;
    source: string;
    param: number;
    target: string;
    result: string;
}

export interface ConnectionMeta {
    selected?: boolean;
}

export interface ConnectionEvents extends MetadataEvents {}

export interface ConnectionType
    extends EventStream<ConnectionEvents>,
        Serializable<ConnectionData>,
        Startable,
        Stoppable,
        Metadata<ConnectionMeta>,
        UpdateMetadata<ConnectionMeta> {
    id: string;
    paramPort: ParamPortType;
    resultPort: ResultPortType;
    pass(value: any): void;
}

export interface NodeDefinition {
    name: string;
    type: string;
    returnType: string | undefined;
    process(this: NodeType, ...args: any[]): any;
    params: ParamDefinition<any>[];
    results: ResultDefinition<any>[];
}

export type Vec2 = {
    x: number;
    y: number;
};

export interface NodeMeta {
    position?: Vec2;
    label?: string;
    selected?: boolean;
}

export interface NodeData<T = any>
    extends Omit<NodeDefinition, "process">,
        Metadata<NodeMeta> {
    id: string;
    cache?: T;
}

export enum NodeEventType {
    ParamPortsAdded = "paramPortsAdded",
    ResultPortsAdded = "resultPortsAdded",
    BeforeProcess = "beforeProcess",
    AfterProcess = "afterProcess",
    ActivityChanged = "activityChanged",
}

export type NodeEvents = {
    [NodeEventType.ParamPortsAdded]: ParamPortType[];
    [NodeEventType.ResultPortsAdded]: ResultPortType[];
    [NodeEventType.BeforeProcess]: any[];
    [NodeEventType.AfterProcess]: any;
    [NodeEventType.ActivityChanged]: boolean;
} & ReadyEvents<NodeType> &
    MetadataEvents;

export interface NodeType
    extends EventStream<NodeEvents>,
        Serializable<NodeData>,
        Startable,
        Stoppable,
        Activatable,
        Metadata<NodeMeta>,
        UpdateMetadata<NodeMeta> {
    id: string;
    definition: NodeDefinition;
    owner: ProcedureType;
    started: boolean;
    cache?: any;
    paramPorts: Map<number, ParamPortType>;
    resultPorts: Map<string, ResultPortType>;
    addParam<T = any>(definition: ParamDefinition<T>): ParamPortType;
    addResult<T = any>(definition: ResultDefinition<T>): ResultPortType;
    getParam(order: number): ParamPortType | null;
    getResult(alias: string): ResultPortType | null;
    active: boolean;
    activate: () => void;
    deactivate: () => void;
}

export interface ProcedureMeta {
    label?: string;
    description?: string;
}

export interface ProcedureData extends Metadata<ProcedureMeta> {
    id: string;
    nodes: NodeData[];
    connections: ConnectionData[];
}

export enum ProcedureEventType {
    NodeAdded = "nodeAdded",
    Connected = "connected",
    NodeRemoved = "nodeRemoved",
    Disconnected = "connectionRemoved",
    ProcedureActivityChanged = "procedureActivityChanged",
}

export type ProcedureEvents = {
    [ProcedureEventType.NodeAdded]: NodeType;
    [ProcedureEventType.NodeRemoved]: string;
    [ProcedureEventType.Connected]: ConnectionType;
    [ProcedureEventType.Disconnected]: string;
    [ProcedureEventType.ProcedureActivityChanged]: boolean;
} & ReadyEvents<ProcedureType> &
    MetadataEvents;

export interface ProcedureType
    extends EventStream<ProcedureEvents>,
        Serializable<ProcedureData>,
        Startable,
        Stoppable,
        Activatable,
        Metadata<ProcedureMeta>,
        UpdateMetadata<ProcedureMeta> {
    id: string;
    container: ContainerType;
    started: boolean;
    connect(
        param: ParamPortType,
        result: ResultPortType,
        data: Partial<ConnectionData>
    ): ConnectionType;
    addNode(data: Partial<NodeData>): NodeType;
    getNode(id: string): NodeType | null;
    getConnection(id: string): ConnectionType | null;
    removeNode(id: string): void;
    disconnect(id: string): void;
    active: boolean;
}

export type ValueTypes = Map<string, Constructible<ValueType<any, any>>>;
export type NodeDefinitions = Map<string, Constructible<NodeDefinition>>;
export type Nodes = Map<string, Constructible<NodeType>>;

export interface ContainerType {
    registerNode(node: Provider<NodeType>): void;
    registerDefinition(def: Provider<NodeDefinition>): void;
    registerType(type: Provider<ValueType<any, any>>): void;
    createNode(data: Partial<NodeData>, owner: ProcedureType): NodeType | null;
    getValueType<T = any, S = any>(type: string): ValueType<T, S> | null;
    extend(container: ContainerType): void;
    nodes: Nodes;
    types: ValueTypes;
    definitions: NodeDefinitions;
}
