/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const common = {
  name: "common",
  mode: "production",
  entry: {
    app: "./src/index.ts",
    build_crx: "./src/lib/build_crx.ts",
  },
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        include: [path.resolve(__dirname, "src")],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 2015,
          mangle: false,
        },
      }),
    ],
  },
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
};

module.exports = [common];
