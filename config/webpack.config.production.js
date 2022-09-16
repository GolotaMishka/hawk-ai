const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const paths = require("./paths");

module.exports = {
  mode: "production",
  entry: {
    main: paths.entryPoint,
    core: ["react", "react-dom"],
  },
  output: {
    path: paths.outputPath,
    publicPath: "/",
    filename: path.join("js", "[name].[chunkhash].js"),
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: ["node_modules", paths.nodeModules, paths.src],
    alias: {
      static: paths.publicFiles,
      public: paths.publicFiles,
    },
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: "local",
                localIdentName: "[hash:base64:5]",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: () => [autoprefixer],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                includePaths: [paths.scss],
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        exclude: [paths.publicFiles],
        loader: "svg-sprite-loader",
      },
      {
        test: /\.(png|svg|jpg|jpeg|webp|gif)$/i,
        include: [paths.publicFiles],
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        include: [paths.publicFiles],
        type: "asset/resource",
      },
    ],
  },
  plugins: (() => {
    const plugins = [
      new HtmlWebpackPlugin({
        template: path.join(paths.publicFiles, "index.html"),
        minify: {
          collapseWhitespace: true,
        },
      }),
      new MiniCssExtractPlugin({
        filename: path.join("css", `[name].[hash].css`),
        chunkFilename: path.join("css", `[id].[hash].css`),
      }),
      new webpack.DefinePlugin({ "process.env.NODE_ENV": '"production"' }),
      new FaviconsWebpackPlugin({
        logo: path.join(paths.publicFiles, "favicon.svg"),
        favicons: {
          appName: "Hawk AI",
          appDescription: "Hawk AI application",
          background: "#FFFFFF",
          orientation: "portrait",
        },
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(paths.publicFiles, "models", "**"),
            to: path.resolve(paths.outputPath),
          },
        ],
      }),
      new Dotenv({
        path: paths.envPath,
      }),
    ];
    return plugins;
  })(),
};
