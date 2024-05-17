import { createId } from "@pravah/utils";
import { beforeEach, describe, expect, it } from 'bun:test';
import { Container } from "./container";
import { Procedure } from "./procedure";
import { ProcedureData } from "./types";

describe("procedure", () => {
    const id = createId();
    const data: ProcedureData = {
        connections: [],
        id,
        nodes: [],
        meta: {
            label: `test-${id}`,
        },
    };
    let procedure: Procedure;
    let container: Container;

    beforeEach(() => {
        container = new Container();
        procedure = new Procedure(container, id, data);
    });

    describe("Procedure.container", () => {
        it("should be defined", () => {
            expect(procedure).toBeInstanceOf(Procedure);
        });

        it("should initialize with default meta if none provided", () => {
            procedure = new Procedure(container, id);
            expect(procedure.meta).toStrictEqual({
                label: expect.any(String),
            });
        });

        it("should initalize with meta if provided in data", () => {
            expect(procedure.meta).toStrictEqual(data.meta);
        });
    });

    describe("procedure.start", () => {
        it("should start the procedure", () => {
            procedure.start();

            expect(procedure.started).toBe(true);
        });
    });

    describe("procedure.", () => {});
});
