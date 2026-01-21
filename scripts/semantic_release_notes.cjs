const fs = require("node:fs");

function readTextFileIfExists(path) {
  try {
    return fs.readFileSync(path, "utf8").trim();
  } catch {
    return "";
  }
}

module.exports = {
  generateNotes: async (pluginConfig, context) => {
    const baseNotes = context?.nextRelease?.notes || "";

    const upstreamRepo = "https://github.com/robotnikz/Sunflow";
    const haRepo = "https://github.com/robotnikz/sunflow-ha";
    const upstreamTag = readTextFileIfExists("sunflow/upstream_version.txt");

    const upstreamLine = upstreamTag ? `- Bundled upstream version: ${upstreamTag}` : "";

    const extra = [
      "---",
      "",
      "### Upstream Sunflow (Main Project)",
      "",
      `- Standalone Docker app: ${upstreamRepo}`,
      upstreamLine,
      "",
      "### Home Assistant Packaging",
      "",
      `- Add-on + integration repo: ${haRepo}`,
      `- Upstream sync process: ${haRepo}/blob/main/docs/SYNCING.md`,
      "",
    ]
      .filter(Boolean)
      .join("\n");

    return `${baseNotes}\n\n${extra}`;
  },
};
