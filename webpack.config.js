const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const webpack = require('webpack')
const HTMLPlugin = require('html-webpack-plugin')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isDev = process.env.NODE_ENV === 'development'

const config = {
  // target: 'web', // 默认是 'web'，可省略
  mode: 'development', // development production
  entry: path.join(__dirname, 'src/index.js'),
  output: {
    filename: 'bundle.[hash:8].js',
    path: path.join(__dirname, 'dist')
  },
  module: {
    rules: [{
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.jsx$/,
        loader: 'babel-loader'
      },
      // {
      //   test: /\.css$/,
      //   use: [
      //     'vue-style-loader',
      //     'css-loader'
      //   ]
      // },
      {
        test: /\.(gif|jpg|jpeg|png|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 1024,
            name: '[name].[ext]'
          }
        }]
      }
    ]
  },
  plugins: [
    // make sure to include the plugin for the magic
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isDev ? '"development"' : '"production"'
      }
    }),
    new HTMLPlugin()
  ]
}

if (isDev) {
  config.module.rules.push([{
    test: /\.styl(us)?$/,
    use: [
      'vue-style-loader',
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true, // 使用前面loader生成的sourceMap，避免重新生成，提高编译效率
        }
      },
      'stylus-loader'
    ]
  }])
  config.devtool = '#cheap-module-eval-source-map'
  config.devServer = {
    port: 8000,
    host: '0.0.0.0',
    overlay: {
      errors: true,
    },
    hot: true,
    // open: true
  }
  config.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )
} else {
  config.entry = {
    app: path.join(__dirname, 'src/index.js'),
    vendor: ['vue']
  }
  config.output.filename = '[name].[chunkhash:8].js'
  config.module.rules.push({
    test: /\.styl(us)?$/,
    use: ExtractTextWebpackPlugin.extract({
      fallback: 'style-loader',
      use: [
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
          }
        },
        'stylus-loader'
      ]
    })
  })
  config.plugins.push(
    new ExtractTextWebpackPlugin({
      // filename: 'style/[name].[contenthash:8].css'
      filename: 'style/[name].[hash:8].css'
    })
    // new MiniCssExtractPlugin({
    //   filename: 'style/[name].[contenthash:8].css'
    // })
  )
  config.optimization = { // 以前用commonChunkPlugins
    minimize: true,
    splitChunks: {  // 分割代码块
      // 必须三选一： "initial(初始化)" | "all(默认就是all)" | "async(异步)"
      chunks: 'all',  // 默认打包node_modules到venders.js
      cacheGroups: { // // 缓存组会继承splitChunks的配置，但是test、priorty和reuseExistingChunk只能用于配置缓存组。从上到下
        commons: {  //  key 为entry中定义的 入口名称，公共模块
          chunks: 'initial', // 必须三选一： "initial"(初始化) | "all" | "async"(默认就是异步)
          minChunks: 2, // 被引用大于2次就抽离，包括2次，建议最少设2次以上
          maxInitialRequests: 5,  // 最大初始化请求书，默认1
          minSize: 0  // 最小尺寸，默认0。大于0字节抽离
        },
        vendor: { // 第三方库
          test: /node_modules/, // 匹配文件夹把它抽离
          chunks: 'initial', 
          name: 'vendor', // 要缓存的 分隔出来的 chunk 名称
          priority: 10,  // 缓存组优先级 false | object | Number ，权重设为10，优先抽离，避免common打包在一起
          enforce: true,
          reuseExistingChunk: true   // 可设置是否重用已用chunk 不再创建新的chunk
        }
      }
    },
    runtimeChunk: true // 将webpack运行时生成代码打包到runtime.js
  }
}

module.exports = config