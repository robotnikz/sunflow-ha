module.exports = {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { changelogFile: "sunflow/CHANGELOG.md" }],
    [
      "@semantic-release/exec",
      {
        prepareCmd: "node scripts/bump_versions.mjs ${nextRelease.version}",
      },
    ],
    ["@semantic-release/github", { assets: [] }],
    [
      "@semantic-release/git",
      {
        assets: [
          "sunflow/CHANGELOG.md",
          "sunflow/config.yaml",
          "custom_components/sunflow/manifest.json",
        ],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
