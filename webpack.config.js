const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Clean = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const pkg = require('./package.json');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
};

process.env.BABEL_ENV = TARGET;

const common = {
  entry: PATHS.app,
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: PATHS.build,
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel?cacheDirectory'],
        include: PATHS.app
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'node_modules/html-webpack-template/index.html',
      title: 'Kanban app',
      appMountId: 'app',
      inject: false
    })
  ]
};

if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
    devtool: 'eval-source-map',
    devServer: {
      historyApiFallback: true,
      hot: true,
      inline: true,
      progress: true,

      // display only errors to reduce the amount of output
      stats: 'errors-only',

      // parse host and port from env so this is easy
      // to customize
      host: process.env.HOST,
      port: process.env.PORT
    },
    module: {
      loaders: [{
        test: /\.css$/,
        loaders: ['style', 'css'],
        include: PATHS.app
      }]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin()
    ]
  });
}

if(TARGET === 'build' || TARGET === 'stats') {
  module.exports = merge(common, {
    entry: {
      app: PATHS.app,
      vendor: Object.keys(pkg.dependencies).filter(function (v) {
        return v !== 'alt-utils';
      })
    },
    output: {
      path: PATHS.build,
      filename: '[name].[chunkhash].js',
      chunkFilename: '[chunkhash].js'
    },
    module: {
      loaders: [{
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css'),
        include: PATHS.app
      }]
    },
    plugins: [
      new Clean([PATHS.build], {
        verbose: false
      }),
      new ExtractTextPlugin('styles.[chunkhash].css'),
      new webpack.optimize.CommonsChunkPlugin({
        names: ['vendor', 'manifest']
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    ]
  });
}
