import { identity } from "@pravah/utils";
import { beforeEach, describe, expect, it } from 'bun:test';
import { Container } from "./container";
import { Node } from "./node";
import {
    NodeDefinition,
    NodeType,
    ParamDefinition,
    Provider,
    ResultDefinition,
    ValueType,
} from "./types";

describe("Container", () => {
    let container: Container;

    const defToken = "defToken";
    class Def implements NodeDefinition {
        name: string;
        type: string = defToken;
        returnType?: string;
        process(this: NodeType, ...args: any[]) {
            throw new Error("Method not implemented.");
        }
        params: ParamDefinition<any>[] = [];
        results: ResultDefinition<any>[] = [];
    }
    const NodeDef: Provider<NodeDefinition> = {
        token: defToken,
        type: Def,
    };

    const typeToken = "any";
    class Any implements ValueType<any, any> {
        type: string = typeToken;
        serialize = identity;
        deserialize = identity;
        morph = identity;
    }

    const AnyType: Provider<ValueType<any, any>> = {
        token: typeToken,
        type: Any,
    };

    beforeEach(() => {
        container = new Container();
    });

    it("should be defined", () => {
        expect(container).toBeInstanceOf(Container);
    });

    describe("container.registerNode", () => {
        it("should register the given node", () => {
            container.registerNode(Node);

            expect(container.nodes.size).toBe(1);
        });
    });

    describe("container.registerType", () => {
        it("should register the given type", () => {
            container.registerType(AnyType);

            expect(container.types.size).toBe(1);
        });
    });

    describe("container.registerDefinition", () => {
        it("should register the given definition", () => {
            container.registerDefinition(NodeDef);

            expect(container.definitions.size).toBe(1);
        });
    });

    describe("container.getValueType", () => {
        it("shoud return null if the registered type doesn't exist", () => {
            expect(container.getValueType("any")).toBeNull();
        });

        it("should return an instance of registered type", () => {
            container.registerType(AnyType);

            const valueType = container.getValueType("any");

            expect(valueType).not.toBeNull();
            expect(valueType).toBeInstanceOf(AnyType.type);
        });

        it("should return a cached instance on consecutive calls", () => {
            container.registerType(AnyType);

            const valueType1 = container.getValueType("any");
            const valueType2 = container.getValueType("any");

            expect(valueType1).toBe(valueType2);
        });
    });

    describe("container.extend", () => {
        const destination = new Container();
        beforeEach(() => {
            container.registerNode(Node);
            container.registerDefinition(NodeDef);
            container.registerType(AnyType);
            destination.extend(container);
        });

        it("should copy over the nodes from the target container", () => {
            expect(destination.nodes.size).toBe(1);
            expect(destination.nodes.get(Node.token)).toBe(Node.type);
        });
        it("should copy over the definitions from the target container", () => {
            expect(destination.definitions.size).toBe(1);
            expect(destination.definitions.get(defToken)).toBe(NodeDef.type);
        });
        it("should copy over the types from the target container", () => {
            expect(destination.types.size).toBe(1);
            expect(destination.types.get(typeToken)).toBe(AnyType.type);
        });
    });
});
