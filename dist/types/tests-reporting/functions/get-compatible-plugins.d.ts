export declare function getCompatiblePlugins(kestraVersion: string): Promise<{
    out: string;
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
