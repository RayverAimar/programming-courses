// Installers for macOS (dmg + zip, Apple Silicon and Intel), Windows (installer + portable) and
// Linux (AppImage + deb). File names are fixed so the site can link to the latest release.
const CONFIG = require("./site.config.json");
const a = CONFIG.artifact;

module.exports = {
  appId: CONFIG.appId,
  productName: CONFIG.name,
  directories: { output: "release", buildResources: "build" },
  files: ["dist/**/*", "platform/electron/**/*", "site.config.json", "build/icons/512x512.png", "package.json"],
  asar: true,
  publish: null,
  mac: {
    target: [{ target: "dmg", arch: ["arm64", "x64"] }, { target: "zip", arch: ["arm64", "x64"] }],
    category: "public.app-category.education",
    icon: "build/icon.icns",
    identity: null,
    artifactName: `${a}-mac-\${arch}.\${ext}`,
  },
  dmg: { artifactName: `${a}-mac-\${arch}.\${ext}` },
  win: { target: [{ target: "nsis", arch: ["x64"] }, { target: "portable", arch: ["x64"] }], icon: "build/icon.ico" },
  nsis: { artifactName: `${a}-win-\${arch}-setup.\${ext}`, oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true },
  portable: { artifactName: `${a}-win-\${arch}-portable.\${ext}` },
  linux: { target: [{ target: "AppImage", arch: ["x64"] }, { target: "deb", arch: ["x64"] }], category: "Education", icon: "build/icons", maintainer: "Rayver Aimar Muñoz Curi", synopsis: "Programming courses with a robot, offline" },
  appImage: { artifactName: `${a}-linux-x86_64.\${ext}` },
  deb: { artifactName: `${a}-linux-amd64.\${ext}` },
};
