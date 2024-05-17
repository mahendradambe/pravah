import * as Core from "@pravah/core";

const token = "std:type:boolean";

class Type implements Core.ValueType<boolean, boolean> {
    type: string = token;
    serialize = (value) => value;
    deserialize = (value) => value;
    morph = (other) => Boolean(other);
}

export const BooleanType: Core.Provider<Core.ValueType<any, any>> = {
    token,
    type: Type,
};
