import axios from "axios";
import { inferKestraRepository, WorkingDir } from "../../utilities/working-dir";

export async function getCompatiblePlugins(kestraVersion: string, opts: {workingDir: WorkingDir}): Promise<{
  out: string;
}> {
  const license = await inferKestraRepository(opts.workingDir) === 'kestra-oss' ? 'OPEN_SOURCE' : undefined;
  const response = await axios.get(
    `https://api.kestra.io/v1/plugins/artifacts/core-compatibility/${kestraVersion}/latest`,
    {
      params: {license: license}
    });
  const data = response.data as APILatestCompatiblePluginsResponse;
  const formatted = convertAPICompatiblePluginResponseToOurCIFormat(data);
  return { out: formatted.plugins.join(' ')};
}

export interface APILatestCompatiblePlugin {
  groupId: string;
  artifactId: string;
  license: string;
  version: string;
}

export type APILatestCompatiblePluginsResponse = APILatestCompatiblePlugin[];

export function convertAPICompatiblePluginResponseToOurCIFormat(
  apiResponse: APILatestCompatiblePluginsResponse,
): { plugins: string[] } {
  const plugins: string[] = [];
  for (const latestCompatiblePlugin of apiResponse) {
    plugins.push(
      `${latestCompatiblePlugin.groupId}:${latestCompatiblePlugin.artifactId}:${latestCompatiblePlugin.version}`,
    );
  }
  return { plugins };
}
