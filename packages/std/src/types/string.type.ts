import * as Core from "@pravah/core";

const token = "std:type:string";

class Type implements Core.ValueType<string, string> {
    type: string = token;
    serialize = (value) => value;
    deserialize = (value) => value;
    morph = (string) => String(string);
}

export const StringType: Core.Provider<Core.ValueType<any, any>> = {
    token,
    type: Type,
};
