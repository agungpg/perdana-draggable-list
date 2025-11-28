const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const libraryExternals = {
  react: {
    root: 'React',
    commonjs: 'react',
    commonjs2: 'react',
    amd: 'react',
  },
  'react-dom': {
    root: 'ReactDOM',
    commonjs: 'react-dom',
    commonjs2: 'react-dom',
    amd: 'react-dom',
  },
}

module.exports = (env = {}, argv = {}) => {
  console.log({env})
  const target = env.target ?? 'library'
  const isDemo = target === 'demo'
  const mode = argv.mode ?? (isDemo ? 'development' : 'production')

  return {
    mode,
    entry: path.resolve(
      __dirname,
      isDemo ? 'src/demo.jsx' : 'src/index.js',
    ),
    output: {
      path: path.resolve(__dirname, isDemo ? 'demo-dist' : 'dist'),
      filename: isDemo ? '[name].js' : 'index.js',
      clean: true,
      assetModuleFilename: '[name][ext]',
      library: isDemo
        ? undefined
        : {
            name: 'PerdanaDraggableList',
            type: 'umd',
            export: 'default',
          },
      globalObject: isDemo ? undefined : 'this',
    },
    devtool: 'source-map',
    devServer: isDemo
      ? {
          static: {
            directory: path.resolve(__dirname, 'demo-dist'),
          },
          port: 3000,
          open: true,
          hot: true,
          compress: true,
          historyApiFallback: true,
        }
      : undefined,
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    externals: isDemo ? undefined : libraryExternals,
    plugins: [
      isDemo &&
        new HtmlWebpackPlugin({
          title: 'Perdana Draggable List Demo',
          filename: 'index.html',
          template: 'src/template.html',
        }),
    ].filter(Boolean),
  }
}
