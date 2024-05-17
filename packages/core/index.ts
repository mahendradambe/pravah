import { Container } from "./src/container";
import { Node } from "./src/node";

export const container = new Container();

container.registerNode(Node);

export * from "./src/connection";
export * from "./src/container";
export * from "./src/helpers";
export * from "./src/node";
export * from "./src/param-port";
export * from "./src/port";
export * from "./src/procedure";
export * from "./src/result-port";
export * from "./src/types";

