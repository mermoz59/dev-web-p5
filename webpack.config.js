const path = require('path')
const glob = require('glob')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const PATHS = {
  src: path.join(__dirname, 'src')
}

const sharedHtmlWebpackConf = name => {
  const result = name === 'index' ? {} : { chunks: ['main'] }
  result.favicon = path.resolve(__dirname, './nina.webp')
  result.template = path.resolve(__dirname, `./src/html/${name}.html`)
  result.filename = `${name}.html`
  return result
}

const config = {
  entry: {
    main: path.resolve(__dirname, './src/app.js')
  },
  output: {
    path: path.resolve(__dirname, './docs'),
    filename: '[name].[chunkhash].bundle.js',
    publicPath: '',
    assetModuleFilename: './src/assets/[name].[contenthash].[ext]',
    clean: true
  },
  devServer: {
    port: 3000,
    compress: true,
    static: './docs',
    headers: {
      'Cache-Control': 'max-age=31536000'
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(sharedHtmlWebpackConf('index', 'Nina Carducci')),
    new MiniCssExtractPlugin(),
    new PurgeCSSPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true })
    }),
    // Define global variable from NODE_ENV for the app
    new webpack.DefinePlugin({
      DEBUG: process.env.NODE_ENV === 'development',
      VERSION: JSON.stringify(require('./package.json').version)
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    // https://webpack.js.org/plugins/copy-webpack-plugin/
    new CopyPlugin({
      patterns: [
        { from: 'robots.txt', to: 'robots.txt' }
      ]
    })
  ],
  module: {
    // https://github.com/jantimon/html-webpack-plugin/blob/main/examples/custom-template/template.html
    rules: [
      {
        test: /\.(html)$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      },
      // https://webpack.js.org/loaders/css-loader/
      // https://www.npmjs.com/package/mini-css-extract-plugin
      // https://github.com/webpack-contrib/css-minimizer-webpack-plugin
      {
        test: /\.css$/,
        use: [
          process.env.NODE_ENV === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
          // 'style-loader', // Creates `style` nodes from JS strings
          'css-loader' // Translates CSS into CommonJS
        ]
      },
      // https://stackoverflow.com/questions/67432536/webpack-5-how-to-display-images-in-html-file
      {
        test: /\.(png|svg|jpg|jpeg|gif|otf|cur|mp4|webp)$/i,
        type: 'asset/resource'
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    },
    minimize: true, // If you want to run it also in development set the optimization.minimize option to true:
    minimizer: [
      // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
      // `...`,
      new TerserPlugin(), // useless because automatically integrate to Webpack 5
      new CssMinimizerPlugin(),
      // Optimize with sharp : https://webpack.js.org/plugins/image-minimizer-webpack-plugin/#optimize-with-sharp
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.sharpMinify,
          options: {
            encodeOptions: {
              jpeg: {
                // https://sharp.pixelplumbing.com/api-output#jpeg
                quality: 100
              },
              // webp: {
              //   // https://sharp.pixelplumbing.com/api-output#webp
              //   // lossless: true,
              //   quality: 100
              // },
              avif: {
                // https://sharp.pixelplumbing.com/api-output#avif
                lossless: true
              },

              // png by default sets the quality to 100%, which is same as lossless
              // https://sharp.pixelplumbing.com/api-output#png
              png: {},

              // gif does not support lossless compression at all
              // https://sharp.pixelplumbing.com/api-output#gif
              gif: {}
            }
          }
        }
      })
    ]
  },
  devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : 'eval-source-map'
}

module.exports = (env, argv) => {
  console.log(`mode = ${argv.mode}, NODE_ENV = ${process.env.NODE_ENV}`)

  return config
}
