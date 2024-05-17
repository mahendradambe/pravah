import * as Core from "@pravah/core";

const token = "std:type:number";

class Type implements Core.ValueType<number, number> {
    type: string = token;
    serialize = (value) => value;
    deserialize = (value) => value;
    morph = (other: any) => Number(other);
}

export const NumberType: Core.Provider<Core.ValueType<any, any>> = {
    token,
    type: Type,
};
