import * as Core from "@pravah/core";

export const logsum: Core.ProcedureData = {
    id: "logsum",
    meta: {},
    connections: [
        {
            id: "sumC:0-sumA:sum",
            param: 0,
            result: "sum",
            source: "sumA",
            target: "sumC",
            meta: {},
        },
        {
            id: "sumC:1-sumB:sum",
            param: 1,
            result: "sum",
            source: "sumB",
            target: "sumC",
            meta: {},
        },
        {
            id: "log:0-sumC:sum",
            param: 0,
            result: "sum",
            source: "sumC",
            target: "log",
            meta: {},
        },
    ],
    nodes: [
        {
            id: "sumA",
            name: "std:def:sum",
            type: "core:node",
            params: [
                {
                    type: "std:type:number",
                    order: 0,
                    value: 1,
                },
                {
                    type: "std:type:number",
                    order: 1,
                    value: 2,
                },
            ],
            results: [
                {
                    alias: "sum",
                    type: "std:type:number",
                },
            ],
            returnType: "std:type:number",
            cache: 3,
            meta: {},
        },
        {
            id: "sumB",
            name: "std:def:sum",
            type: "core:node",
            params: [
                {
                    type: "std:type:number",
                    order: 0,
                    value: 3,
                },
                {
                    type: "std:type:number",
                    order: 1,
                    value: 4,
                },
            ],
            results: [
                {
                    alias: "sum",
                    type: "std:type:number",
                },
            ],
            returnType: "std:type:number",
            cache: 7,
            meta: {},
        },
        {
            id: "sumC",
            name: "std:def:sum",
            type: "core:node",
            params: [
                {
                    type: "std:type:number",
                    order: 0,
                },
                {
                    type: "std:type:number",
                    order: 1,
                },
            ],
            results: [
                {
                    alias: "sum",
                    type: "std:type:number",
                },
            ],
            returnType: "std:type:number",
            cache: 10,
            meta: {},
        },
        {
            id: "log",
            name: "std:def:log",
            type: "core:node",
            params: [
                {
                    type: "std:type:number",
                    order: 0,
                },
            ],
            results: [],
            meta: {},
        },
    ],
};
