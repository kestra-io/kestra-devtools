import { describe, expect, it } from "vitest";
import { listPlugins } from "./list-plugins";

describe("list-plugins test", () => {
  it("parse OK for all tests success", async () => {
    const ossPluginsFile = `
        {
          "plugins": [
            {
              "repository": "plugin-ai",
              "package": "io.kestra.plugin",
              "name": "plugin-ai"
            },
            {
              "repository": "plugin-jdbc",
              "package": "io.kestra.plugin",
              "name": "plugin-jdbc-dremio"
            }
          ]
        }
        `;

    const res = listPlugins(ossPluginsFile, "0.22222.1");

    expect(res.plugins).toEqual([
      "io.kestra.plugin:plugin-ai:0.22222.1",
      "io.kestra.plugin:plugin-jdbc-dremio:0.22222.1",
    ]);
    expect(res.repositories).toEqual(["plugin-ai", "plugin-jdbc"]);
  });
});
