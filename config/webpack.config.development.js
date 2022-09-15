const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const paths = require('./paths');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: ['react-hot-loader/patch', paths.entryPoint],
  output: {
    path: paths.outputPath,
    publicPath: '/',
    filename: path.join('js', '[name].js'),
  },
  resolve: {
    extensions: ['.js', '.jsx', 'ts', '.jsx'],
    modules: ['node_modules', paths.nodeModules, paths.src],
    alias: {
      'react-dom': '@hot-loader/react-dom',
      static: paths.publicFiles,
      public: paths.publicFiles,
    },
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.svg$/,
        exclude: [paths.publicFiles],
        loader: 'svg-sprite-loader',
      },
      {
        test: /\.(png|svg|jpg|jpeg|webp|gif)$/i,
        include: [paths.publicFiles],
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        include: [paths.publicFiles],
        type: 'asset/resource',
      },

      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[local]-[hash:base64:5]',
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(paths.publicFiles, 'index.html'),
    }),
    new Dotenv({
      path: paths.envPath,
    }),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  },
};
