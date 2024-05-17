import {
    ContainerType,
    NodeData,
    NodeDefinition,
    NodeDefinitions,
    Nodes,
    NodeType,
    ProcedureType,
    Provider,
    ValueType,
    ValueTypes,
} from "./types";

export class Container implements ContainerType {
    definitions: NodeDefinitions = new Map();
    nodes: Nodes = new Map();
    types: ValueTypes = new Map();
    private _typeInstances: Map<string, ValueType<any, any>> = new Map();

    registerNode(node: Provider<NodeType>) {
        this.nodes.set(node.token, node.type);
    }

    registerDefinition(def: Provider<NodeDefinition>) {
        this.definitions.set(def.token, def.type);
    }

    registerType(valueType: Provider<ValueType<any, any>>) {
        this.types.set(valueType.token, valueType.type);
    }

    createNode(data: Partial<NodeData>, owner: ProcedureType) {
        const DefinitionType = this.definitions.get(data.name ?? '');
        if (DefinitionType) {
            const definition = new DefinitionType();
            definition.params = (definition.params ?? []).concat(
                data.params ?? []
            );
            definition.results = (definition.results ?? []).concat(
                data.results ?? []
            );
            const Node = this.nodes.get(definition.type);

            if (Node) {
                const instance = new Node(data, definition, owner);
                instance.updateMeta(() => data.meta);
                instance.cache = data.cache;
                return instance;
            }
        }
        return null;
    }

    getValueType(type: string) {
        let instance = this._typeInstances.get(type);
        if (instance) {
            return instance;
        }
        const Type = this.types.get(type);
        if (Type) {
            instance = new Type();
            this._typeInstances.set(type, instance);
        }
        return instance ?? null;
    }

    extend(container: ContainerType): void {
        Array.from(container.definitions.entries()).forEach(([token, type]) => {
            this.registerDefinition({ token, type });
        });
        Array.from(container.nodes.entries()).forEach(([token, type]) => {
            this.registerNode({ token, type });
        });
        Array.from(container.types.entries()).forEach(([token, type]) => {
            this.registerType({ token, type });
        });
    }
}
