import fs from "fs";
import os from "os";
import path from "path";

import * as core from "@actions/core";
import * as gh from "@actions/github";
import * as tc from "@actions/tool-cache";

// Grab the OS and Arch.
const myPlat = os.platform();
core.debug("myPlat: " + myPlat);
const myArch = os.arch();
core.debug("myArch: " + myArch);

// Leverage the GitHub Action environment variables to authenticate with GitHub
const octokit = gh.getOctokit(process.env.GITHUB_TOKEN);
core.debug("octokit: " + JSON.stringify(octokit));

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x32: "386",
    x64: "amd64",
  };
  core.debug("mappedArch: " + (mappings[arch] || arch));
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    win32: "windows",
  };
  core.debug("mappedOS: " + (mappings[os] || os));
  return mappings[os] || os;
}

// getRelease returns the octokit release object for the given version
async function getRelease(version) {
  var release;
  try {
    if (version === "latest") {
      release = await octokit.rest.repos.getLatestRelease({
        owner: "jason-dour",
        repo: "hugo-preproc",
      });
      } else {
        release = await octokit.rest.repos.getReleaseByTag({
          owner: "jason-dour",
          repo: "hugo-preproc",
          tag: version,
        });
      }
  } catch (e) {
    core.setFailed(e);
  }
  core.debug("release: " + JSON.stringify(release));
  return release
}

// getDownloadObject returns an object with the following properties:
//   url: the url to download the tool from
async function getDownloadObject(version) {
  const release = await getRelease(version);
  if (!release || !release.data) {
    core.setFailed(Error(`No valid release returned for: { version: ${version} }`));
    return { url: "" };
  }
  core.debug("release: " + release.data.name);

  const asset = release.data.assets.find((asset) => {
    core.debug("asset: " + asset.name);
    let asset_mapped = asset.name.includes(
      `_${mapOS(os.platform())}_${mapArch(os.arch())}`
    )
    core.debug("asset_mapped: " + asset_mapped.data.name);
    let asset_unmapped = asset.name.includes(
      `_${myPlat}_${myArch}`
    )
    core.debug("asset_unmapped: " + asset_unmapped.data.name);

    if (asset_mapped || asset_unmapped) {
      core.debug("returning: " + asset.name);
      return asset
    }
  }
  );
  core.debug("asset: " + JSON.stringify(asset));
  if (!asset) {
    core.setFailed(Error(`No valid asset found for: { version: ${version}, platform: ${myPlat}, arch: ${myArch} }`));
    return { url: "" };
  }

  const url = asset.browser_download_url;
  core.info("url: " + url);
  return { url };
}

// setup downloads the tool and installs it to the given path
async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput("hugo-preproc-version");
    core.debug("version: " + version);

    // Download the specific version of the tool.
    const download = await getDownloadObject(version);

    let exeName = "";
    if (myPlat === "win32") {
      exeName = path.join(process.env.RUNNER_TEMP, "hugo-preproc.exe");
    } else {
      exeName = path.join(process.env.RUNNER_TEMP,"hugo-preproc");
    }
    const pathToCLI = await tc.downloadTool(
      download.url,
      exeName
    );
    fs.chmodSync(pathToCLI, 0o755); // make the binary executable
    core.debug("pathToCLI: " + pathToCLI);

    // Expose the tool by adding it to the PATH
    core.addPath(process.env.RUNNER_TEMP);
  } catch (e) {
    core.setFailed(e);
  }
}

export default setup;

setup();
