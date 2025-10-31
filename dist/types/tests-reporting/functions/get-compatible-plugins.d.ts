import { WorkingDir } from "../../utilities/working-dir";
export declare function getCompatiblePlugins(kestraVersion: string, opts: {
    workingDir: WorkingDir;
}): Promise<{
    output: string;
    plugins: string[];
}>;
export interface APILatestCompatiblePlugin {
    groupId: string;
    artifactId: string;
    license: string;
    version: string;
}
export type APILatestCompatiblePluginsResponse = APILatestCompatiblePlugin[];
export declare function convertAPICompatiblePluginResponseToOurCIFormat(apiResponse: APILatestCompatiblePluginsResponse): {
    plugins: string[];
};
