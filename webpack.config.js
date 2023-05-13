/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const nodeExternals = require("webpack-node-externals");

const common = {
  name: "common",
  mode: "production",
  entry: {
    app: path.resolve(__dirname, "src", "index.ts"),
    build_crx: path.resolve(__dirname, "src", "lib", "build_crx.ts"),
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
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 2015,
          mangle: false,
        },
      }),
    ],
  },
  externals: [nodeExternals()],
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src", "recorder", "extension"),
          to: path.resolve(__dirname, "dist", "recorder", "extension"),
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src", "lib", "vendor"),
          to: path.resolve(__dirname, "dist", "vendor"),
        },
      ],
    }),
  ],
};

module.exports = [common];
