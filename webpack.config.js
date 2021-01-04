const path = require("path");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const {InjectManifest} = require('workbox-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
// const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./public/index.js",
  output: {
    // publicPath: "dist/",
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  // module: {
  //   rules: [
  //     {
  //       test: /\.html$/i,
  //       use: [
  //         {
  //           loader: "file-loader",
  //           options: {
  //             name: "[name].[ext]",
  //           },
  //         },
  //       ],
  //     },
  //   ],
  // },
  plugins: [
    process.env.NODE_ENV === "local" ? new CleanWebpackPlugin() : () => {},
    // new InjectManifest({
    //   swSrc: './public/service-worker.js',
    // }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      // Do not precache images
      // exclude: [/\.(?:png|jpg|jpeg|svg)$/],

      // Define runtime caching rules.
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/unpkg/g,
          handler: "CacheFirst",
          options: {
            cacheName: "cdn-cache",
          },
        },
        {
          // Match any request that ends with .png, .jpg, .jpeg or .svg.
          urlPattern: /\.(?:png|jpg|jpeg|svg|css)$/,

          // Apply a cache-first strategy.
          handler: "CacheFirst",

          options: {
            // Use a custom cache name.
            cacheName: "images",

            // Only cache 20 images.
            expiration: {
              maxEntries: 30,
            },
          },
        },
        {
          urlPattern: /.*\.(js|mjs)/, // 匹配文件
          handler: "NetworkFirst", // 网络优先
          options: {
            cacheName: "javascripts",
          },
        },
      ],
    }),
    // new webpack.DefinePlugin({
    //   "process.env.CV_APP_NAME": process.env.NODE_ENV === 'new' ? 'cv-setup' : 'app',
    // }),
    new HtmlWebpackPlugin({
      template: './views/index.html',
      cv_app_name: process.env.NODE_ENV === 'new' ? 'cv-setup' : 'app'
    }),
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, "views"),
          from: "error.html",
        },
        {
          context: path.resolve(__dirname, "public/javascripts"),
          from: "*",
          to: "javascripts"
        },
        {
          context: path.resolve(__dirname, "public/stylesheets"),
          from: "*",
          to: "stylesheets"
        },
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
      // `...`
      new HtmlMinimizerPlugin(),
    ],
  },
};
