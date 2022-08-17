# action-setup-hugo-preproc

![Action Tests](https://github.com/jason-dour/action-setup-hugo-preproc/actions/workflows/test.yml/badge.svg)

Set up your GitHub Actions workflow with a specific version of hugo-preproc.

## Usage

Input `hugo-preproc-version` is optional; default is to install the latest version. See [hugo-preproc releases](https://github.com/jason-dour/hugo-preproc/releases) for list of specific semver release tags.

### Basic

Add a step that calls `jason-dour/action-setup-hugo-preproc`, providing the `GITHUB_TOKEN` from the workflow as an environment variable.  **This is required**.

```yaml
steps:
- uses: actions/checkout@v3
- uses: jason-dour/action-setup-hugo-preproc@v1.0.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: hugo-preproc --version
```

### Specific hugo-preproc Version

Optionally, you may also specify the semver release tag of a specific hugo-preproc release to be installed.

```yaml
steps:
- uses: actions/checkout@v3
- uses: jason-dour/action-setup-hugo-preproc@v1.0.0
  with:
    hugo-preproc-version: v3.10.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: hugo-preproc --version
```
