import { ofType } from "@pravah/stream";
import { beforeEach, describe, expect, it, jest } from 'bun:test';
import { Container } from "./container";
import { withType } from "./helpers";
import { Node } from "./node";
import { ParamPort } from "./param-port";
import { Procedure } from "./procedure";
import { ResultPort } from "./result-port";
import {
    NodeData,
    NodeDefinition,
    NodeEventType,
    NodeType,
    ParamData,
    ParamDefinition,
    ReadyEventType,
    ResultData,
    ResultDefinition,
} from "./types";

describe("node", () => {
    describe("Node", () => {
        const Def = withType(
            class Def implements NodeDefinition {
                name: string;
                type: string;
                returnType?: string;
                process(this: NodeType, ...args: any[]) {
                    return true;
                }
                params: ParamDefinition<any>[];
                results: ResultDefinition<any>[];
            },
            "def:test"
        );
        let container;
        let procedure;
        const nodeData: NodeData = {
            id: "test-node",
            meta: {
                label: "test-node",
            },
            name: "core:node",
            params: [],
            results: [],
            type: Node.token,
        };
        let node: NodeType;
        const param1Data: ParamData<any> = {
            order: 0,
            type: "any",
        };
        const result1Data: ResultData<any> = { type: "any", alias: "result" };

        beforeEach(() => {
            container = new Container();
            procedure = new Procedure(container, "test-proc");
            node = new Node.type(nodeData, new Def(), procedure);
        });

        it("should be defined", () => {
            expect(node).toBeDefined();
            expect(node).toBeInstanceOf(Node.type);
        });

        describe("node.updateMeta", () => {
            it("should take a setter which receive's the current meta", () => {
                const setter = jest.fn((meta) => ({ ...meta, label: "other" }));

                node.updateMeta(setter);

                expect(setter).toBeCalledWith({
                    ...nodeData.meta,
                    label: "test-node",
                });

                expect(node.meta).toStrictEqual({
                    ...nodeData.meta,
                    label: "other",
                });
            });
        });

        describe("node.serialize", () => {
            it("should return serialized state", () => {
                expect(node.serialize()).toStrictEqual({
                    cache: undefined,
                    id: "test-node",
                    meta: {
                        label: "test-node",
                    },
                    name: undefined,
                    params: [],
                    results: [],
                    returnType: undefined,
                    type: undefined,
                });
            });
        });

        describe("node.addParam", () => {
            it("should add the param port as per given data", () => {
                node.addParam(param1Data);

                expect(node.paramPorts.size).toBe(1);
            });

            it("should emit param-port-added event if the node is already started", () => {
                const subscriber = jest.fn();
                node.start();
                node.stream$
                    .filter(ofType(NodeEventType.ParamPortsAdded))
                    .map((e) => e.type)
                    .subscribe(subscriber);

                node.addParam(param1Data);

                expect(subscriber).toBeCalledWith(
                    NodeEventType.ParamPortsAdded
                );
            });
        });

        describe("node.addResult", () => {
            it("should add the param port as per given data", () => {
                node.addResult(result1Data);

                expect(node.resultPorts.size).toBe(1);
            });

            it("should emit param-port-added event if the node is already started", () => {
                const subscriber = jest.fn();
                node.start();
                node.stream$
                    .filter(ofType(NodeEventType.ResultPortsAdded))
                    .map((e) => e.type)
                    .subscribe(subscriber);

                node.addResult(result1Data);

                expect(subscriber).toBeCalledWith(
                    NodeEventType.ResultPortsAdded
                );
            });
        });

        describe("node.getParam", () => {
            it("should return null if the queried param doesn't exist", () => {
                expect(node.getParam(0)).toBeNull();
            });

            it("should return param if the queried param exists", () => {
                node.addParam(param1Data);

                expect(node.getParam(0)).toBeInstanceOf(ParamPort);
            });
        });

        describe("node.getResult", () => {
            it("should return null if the queried result doesn't exist", () => {
                expect(node.getResult("result")).toBeNull();
            });

            it("should return result if the queried result exists", () => {
                node.addResult(result1Data);

                expect(node.getResult("result")).toBeInstanceOf(ResultPort);
            });
        });

        describe("node.start", () => {
            it("should emit param-port added events", () => {
                const subscriber = jest.fn();

                node.stream$
                    .filter(ofType(NodeEventType.ParamPortsAdded))
                    .map((e) => e.type)
                    .subscribe(subscriber);

                node.start();

                expect(subscriber).toBeCalledWith(
                    NodeEventType.ParamPortsAdded
                );
            });

            it("should emit result-port added events", () => {
                const subscriber = jest.fn();

                node.stream$
                    .filter(ofType(NodeEventType.ResultPortsAdded))
                    .map((e) => e.type)
                    .subscribe(subscriber);

                node.start();

                expect(subscriber).toBeCalledWith(
                    NodeEventType.ResultPortsAdded
                );
            });

            it("should start the node", () => {
                const subscriber = jest.fn();

                node.stream$
                    .filter(ofType(ReadyEventType.OnReady))
                    .map((e) => e.type)
                    .subscribe(subscriber);
                node.start();

                expect(node.started).toBe(true);
                expect(subscriber).toBeCalledWith(ReadyEventType.OnReady);
            });
        });

        describe("node.stop", () => {
            it("should stop an already running node", () => {
                node.stop();

                expect(node.started).toBe(false);
            });

            it.todo("should deactivate if the node is active");
        });

        describe("node.started", () => {
            it("should return node's started status", () => {
                expect(node.started).toBe(false);

                node.start();

                expect(node.started).toBe(true);
            });
        });

        describe("node.activate", () => {
            describe("when the node is started", () => {
                it("shouldn't start the node", () => {
                    const subscriber = jest.fn();
                    node.stream$
                        .filter(ofType(NodeEventType.ActivityChanged))
                        .map((e) => e.type)
                        .subscribe(subscriber);

                    node.activate();

                    expect(node.active).toBe(false);
                    expect(subscriber).not.toBeCalled();
                });

                it("should activate the node and emit", () => {
                    const subscriber = jest.fn();
                    node.stream$
                        .filter(ofType(NodeEventType.ActivityChanged))
                        .map((e) => e.type)
                        .subscribe(subscriber);

                    node.start();
                    node.activate();

                    expect(node.active).toBe(true);
                    expect(subscriber).toBeCalledWith(
                        NodeEventType.ActivityChanged
                    );
                });
            });
        });

        describe("node.deactivate", () => {
            describe("when the node is started", () => {
                it("should deactivate the node and emit", () => {
                    const subscriber = jest.fn();
                    node.stream$
                        .filter(ofType(NodeEventType.ActivityChanged))
                        .map((e) => e.type)
                        .subscribe(subscriber);

                    node.start();

                    node.activate();
                    expect(node.active).toBe(true);

                    node.deactivate();

                    expect(node.active).toBe(false);
                    expect(subscriber).toBeCalledTimes(2);
                    expect(subscriber).toBeCalledWith(
                        NodeEventType.ActivityChanged
                    );
                });
            });
        });

        describe("node.started", () => {
            it("should return node's started status", () => {
                expect(node.started).toBe(false);

                node.start();

                expect(node.started).toBe(true);
            });
        });

        describe("node.meta", () => {
            it("should return the node's meta", () => {
                expect(node.meta).toStrictEqual(nodeData.meta);
            });
        });
    });
});
