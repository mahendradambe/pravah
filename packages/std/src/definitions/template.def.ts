import * as Core from "@pravah/core";
import { StringType } from "../types";
import pupa from "pupa";

const token = "std:def:template";

class Def implements Core.NodeDefinition {
    returnType = StringType.token;
    type = Core.NodeToken;
    name = token;
    params: Core.ParamDefinition<any>[] = [
        {
            type: StringType.token,
            order: 0,
            alias: "template",
        },
    ];
    results: Core.ResultDefinition<any>[] = [
        {
            type: StringType.token,
            alias: "result",
        },
    ];

    process(template: string = "", ...vars: any[]) {
        return pupa(template, vars, { ignoreMissing: true });
    }
}

export const TemplateDef: Core.Provider<Core.NodeDefinition> = {
    token,
    type: Def,
};
