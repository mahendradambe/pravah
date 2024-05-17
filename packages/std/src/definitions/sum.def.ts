import * as Core from "@pravah/core";
import { NumberType } from "../types";

const token = "std:def:sum";

class Def implements Core.NodeDefinition {
    returnType = NumberType.token;
    type = Core.NodeToken;
    name = token;
    params: Core.ParamDefinition<any>[] = [
        {
            type: NumberType.token,
            order: 0,
            alias: "a",
        },
        {
            type: NumberType.token,
            order: 1,
            alias: "b",
        },
    ];
    results: Core.ResultDefinition<any>[] = [
        {
            type: NumberType.token,
            alias: "result",
        },
    ];

    process(a = 0, b = 0) {
        return a + b;
    }
}

export const SumDef: Core.Provider<Core.NodeDefinition> = {
    token,
    type: Def,
};
