/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { ProvidePlugin } = require("webpack");

const common = {
  name: "common",
  mode: "production",
  entry: {
    app: "./src/index.ts",
    render: "./src/renderer/static/render.ts",
    preload: "./src/renderer/static/preload.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  target: "electron-renderer",
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
    fallback: {
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/renderer/static/index.html",
      scriptLoading: "defer",
      chunks: ["render"],
    }),
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
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
};

module.exports = [common];
