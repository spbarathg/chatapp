const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV === 'development';
const target = process.env.TARGET || 'renderer';

// Common CSP directives
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' ws: wss: https:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self'",
  "media-src 'self'"
].join('; ');

const commonConfig = {
  mode: isDevelopment ? 'development' : 'production',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.wasm'],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
      "vm": false,
      "path": require.resolve("path-browserify"),
      "fs": false,
      "os": require.resolve("os-browserify/browser"),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
              ],
              plugins: [
                '@babel/plugin-transform-runtime'
              ]
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ],
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};

const mainConfig = {
  ...commonConfig,
  entry: './src/main.ts',
  target: 'electron-main',
  devtool: isDevelopment ? 'source-map' : 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
    clean: false
  },
  plugins: [
    ...commonConfig.plugins,
  ],
};

const rendererConfig = {
  ...commonConfig,
  entry: './src/renderer/index.tsx',
  target: 'web',
  devtool: isDevelopment ? 'source-map' : 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].[contenthash].js',
    publicPath: isDevelopment ? '/' : './',
    clean: true
  },
  devServer: {
    host: 'localhost',
    port: 3007,
    compress: true,
    historyApiFallback: true,
    hot: true,
    static: [
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/'
      },
      {
        directory: path.join(__dirname, 'dist/renderer'),
        publicPath: '/'
      }
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': cspDirectives
    },
    devMiddleware: {
      writeToDisk: true
    }
  },
  plugins: [
    ...commonConfig.plugins,
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      meta: {
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: cspDirectives
        }
      }
    }),
  ],
};

const preloadConfig = {
  ...commonConfig,
  entry: './src/preload.ts',
  target: 'electron-preload',
  devtool: isDevelopment ? 'source-map' : 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'preload.js',
    clean: false
  },
  plugins: [
    ...commonConfig.plugins,
  ],
};

module.exports = target === 'main' ? mainConfig : target === 'preload' ? preloadConfig : rendererConfig; 