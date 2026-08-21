const assert = require("node:assert/strict");
const { mkdtemp, readFile, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const test = require("node:test");

const {
  ProjectSettingsHelpers,
  UnityProjectVersion,
} = require("../dist/index.js");
const { makeRegexpFromStringFormat } = require("../dist/functions/RegexFromString.js");

test("reads and writes Unity player version strings", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unity-semver-updater-"));
  const projectSettingsPath = join(directory, "ProjectSettings.asset");
  await writeFile(
    projectSettingsPath,
    [
      "PlayerSettings:",
      "  bundleVersion: 1.2.3.4-rc.1+build.5",
      "  switchDisplayVersion: 1.2.3",
    ].join("\n"),
  );

  const existing = await ProjectSettingsHelpers.getExistingBundleVersion(projectSettingsPath);
  assert.ok(existing);
  assert.equal(existing.major, 1);
  assert.equal(existing.minor, 2);
  assert.equal(existing.patch, 3);
  assert.equal(existing.quad, 4);
  assert.equal(existing.toString(), "1.2.3-rc.1+build.5");

  const updated = await ProjectSettingsHelpers.writeToProjectSettings(projectSettingsPath, {
    bundleVersion: "2.0.0",
    buildNumber: null,
    switchReleaseVersion: null,
    switchDisplayVersion: "2.0.0",
    ps4MasterVersion: null,
    ps4AppVersion: null,
    metroPackageVersion: null,
    XboxOneVersion: null,
    psp2MasterVersion: null,
    psp2AppVersion: null,
  });

  assert.equal(updated, true);
  const contents = await readFile(projectSettingsPath, "utf8");
  assert.match(contents, /bundleVersion: 2\.0\.0/);
  assert.match(contents, /switchDisplayVersion: 2\.0\.0/);
});

test("formats version placeholders without evaluating template expressions", () => {
  const version = new UnityProjectVersion(1, 2, 3, 4, "rc.1", "build.5", "1.2.3.4");
  assert.equal(version.toFormattedOutput("{major}.{major}.{build}.{revision}"), "1.1.3.4");

  globalThis.__unitySemverUpdaterProbe = false;
  const format = "{major}.${globalThis.__unitySemverUpdaterProbe = true}";
  assert.equal(version.toFormattedOutput(format), format.replace("{major}", "1"));
  assert.equal(globalThis.__unitySemverUpdaterProbe, false);

  const matcher = makeRegexpFromStringFormat("bundleVersion: {major}.${globalThis.__unitySemverUpdaterProbe = true}");
  assert.match("bundleVersion: 1.${globalThis.__unitySemverUpdaterProbe = true}", matcher);
  assert.equal(globalThis.__unitySemverUpdaterProbe, false);
  delete globalThis.__unitySemverUpdaterProbe;
});
