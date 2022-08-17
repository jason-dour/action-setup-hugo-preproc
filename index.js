const fs = require("fs");
const os = require("os");
const path = require("path");

const core = require("@actions/core");
const gh = require("@actions/github");
const tc = require("@actions/tool-cache");

// Grab the OS and Arch.
const myPlat = os.platform();
const myArch = os.arch();

// Leverage the GitHub Action environment variables to authenticate with GitHub
const octokit = new gh.getOctokit(process.env.GITHUB_TOKEN);

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
  return release
}

// getDownloadObject returns an object with the following properties:
//   url: the url to download the tool from
async function getDownloadObject(version) {
  const release = await getRelease(version);
  core.debug("release: " + release.data.name);
  const asset = release.data.assets.find((asset) =>
    asset.name.includes(
      `_${myPlat}_${myArch}`
    )
  );
  core.debug("asset: " + asset)
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

    var exeName = "";
    if (myPlat === "win32") {
      exeName = path.join(process.env.RUNNER_TEMP,"hugo-preproc.exe");
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
