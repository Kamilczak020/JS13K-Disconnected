const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

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
    }, {
      test: /\.css$/,
      use: [ 'style-loader', 'css-loader' ],
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      minify: true,
    }),
    new CopyWebpackPlugin([
        { from: './images' },
      ]),
    new ImageminPlugin({
      test: /\.png$/,
      pngquant: {
        quality: '70'
      }
    }),
    new ZipPlugin({
      filename: 'game.zip',
      include: [
        /\.js$/,
        /\.png$/,
        /\.html$/,
      ]
    }),
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        test: /\.js$/
      }),
    ],
  }
};
