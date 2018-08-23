const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
          loader: "babel-loader"
      }
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      minify: true,
    }),
    new ZipPlugin({
      filename: 'game.zip',
      include: [
        /\.js$/,
        /\.png$/,
        /\.html$/,
      ]
    })
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        test: /\.js$/
      }),
    ],
  }
};
