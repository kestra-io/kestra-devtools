export function listPlugins(
  pluginsFileContent: string,
  requestedVersion: string,
): {
  plugins: string[];
  repositories: string[];
} {
  const parsed = JSON.parse(pluginsFileContent) as PluginsFile;

  if (!parsed.plugins || parsed.plugins.length === 0) {
    throw new Error("Invalid plugins file");
  }

  const pluginsWithVersion: string[] = [];
  const repositories: string[] = [];
  for (const plugin of parsed.plugins) {
    pluginsWithVersion.push(`${plugin.package}:${plugin.name}:${requestedVersion}`);
    repositories.push(plugin.repository);
  }

  return { plugins: pluginsWithVersion, repositories: repositories };
}

interface PluginsFile {
  plugins: FilePlugin[];
}

interface FilePlugin {
  repository: string;
  package: string;
  name: string;
}
