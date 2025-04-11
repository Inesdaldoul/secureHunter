module.exports = {
  inputDir: "./assets/icons/system", // Source SVGs (alert-triangle.svg, shield-check.svg, radar.svg)
  additionalDirs: ["./assets/icons/actions"], // Additional SVGs (encrypt.svg, scan.svg)
  outputFile: "./assets/icons/sprite/icons-sprite.prod.svg",
  prefix: "icon-",
  optimize: true,
  svgoConfig: {
    plugins: [
      { removeViewBox: false },
      { removeUnusedNS: true },
      { cleanupIDs: true }
    ]
  }
};