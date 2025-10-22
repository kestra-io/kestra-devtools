import { describe, expect, it } from "vitest";
import {
  APILatestCompatiblePluginsResponse,
  convertAPICompatiblePluginResponseToOurCIFormat,
} from "./get-compatible-plugins";

describe("convertAPICompatiblePluginResponseToOurCIFormat test", () => {
  it("ok OSS", async () => {
    const ossResponse: APILatestCompatiblePluginsResponse = [
      {
        groupId: "io.kestra.storage",
        artifactId: "storage-gcs",
        license: "OPEN_SOURCE",
        version: "1.0.1",
      },
      {
        groupId: "io.kestra.plugin",
        artifactId: "plugin-jdbc-oracle",
        license: "OPEN_SOURCE",
        version: "1.0.0",
      },
    ];

    const res = convertAPICompatiblePluginResponseToOurCIFormat(ossResponse);

    expect(res.plugins).toEqual([
      "io.kestra.storage:storage-gcs:1.0.1",
      "io.kestra.plugin:plugin-jdbc-oracle:1.0.0",
    ]);
  });
  // TODO secret special handling
  // TODO OSS vs EE
});
