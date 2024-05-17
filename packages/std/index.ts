import * as Core from "@pravah/core";
import * as Def from "./src/definitions";
import * as Type from "./src/types";

const container = new Core.Container();

container.extend(Core.container);
container.registerDefinition(Def.LogDef);
container.registerDefinition(Def.SumDef);
container.registerDefinition(Def.TemplateDef);
container.registerType(Type.BooleanType);
container.registerType(Type.NumberType);
container.registerType(Type.StringType);

export * from "./src/definitions";
export { Def, Type, container };

