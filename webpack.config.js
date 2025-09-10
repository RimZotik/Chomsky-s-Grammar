const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Определяем какую конфигурацию использовать
const target = process.env.WEBPACK_TARGET;

const mainConfig = {
  name: "main",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./src/main/main.ts",
  target: "electron-main",
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

const preloadConfig = {
  name: "preload",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./src/main/preload.ts",
  target: "electron-preload",
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "preload.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

const rendererConfig = {
  name: "renderer",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./src/renderer/index.tsx",
  target: "electron-renderer",
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "renderer.js",
    clean: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/renderer/index.html",
      filename: "index.html",
      inject: "body",
      scriptLoading: "blocking",
      minify: false, // Отключаем минификацию для отладки
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

// Возвращаем только нужную конфигурацию или все
if (target === "main") {
  module.exports = mainConfig;
} else if (target === "preload") {
  module.exports = preloadConfig;
} else if (target === "renderer") {
  module.exports = rendererConfig;
} else {
  module.exports = [mainConfig, preloadConfig, rendererConfig];
}
