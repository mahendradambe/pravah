import * as Core from "@pravah/core";

const token = "std:def:log";

class Def implements Core.NodeDefinition {
    params: Core.ParamDefinition<any>[] = [
        {
            type: token,
            order: 0,
            alias: "payload",
        },
    ];
    results: Core.ResultDefinition<any>[];
    type = Core.NodeToken;
    name = token;

    process(...args: any[]) {
        console.log(...args);
    }
}

export const LogDef: Core.Provider<Core.NodeDefinition> = {
    token,
    type: Def,
};
