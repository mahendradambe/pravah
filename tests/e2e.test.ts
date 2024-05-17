import * as Core from "@pravah/core";
import * as Std from "@pravah/std";
import { logsum } from "./mock";

describe("e2e", () => {
    it("works", () => {
        const container = Std.container;

        const procedure = new Core.Procedure(container, logsum.id, logsum);
        //     __________________
        //  *  [(0)             ]
        //  *  |     sumA  (sum)|\
        //  *  [(1)             ] \     ______________
        //  *  [________________]  \    |            |
        //  *                      | -> [(1)  log    ]
        //  *  __________________  /    |____________|
        //  *  [(0)             ] /
        //  *  |     sumB  (sum)|/
        //  *  [(1)             ]
        //  *  [________________]
        //  *  */

        procedure.start();
        procedure.activate();

        const procedureData = procedure.serialize();

        expect(JSON.stringify(procedureData, null, 4)).toMatchSnapshot();
    });
});
