import { defineConfig } from 'umi';
import { resolve } from 'path';

export default defineConfig({
  define: {
    // 开盘时间
    OPENTIME: process.env.OPENTIME,
    // 项目名
    TITLE: process.env.TITLE,
  },
  links: [{ rel: 'icon', href: '/favicon.ico' }],
  chainWebpack(config) {
    config.module
      .rule('svg-sprite')
      .test(/\.svg$/)
      .include.add(resolve(__dirname, 'src/assets/icons'))
      .end()
      .use('svg-sprite-loader' /*使用svg-sprite-loader*/)
      .loader('svg-sprite-loader')
      .options({ extract: false } /*不要解析出文件*/)
      .end();
    config.plugin('svg-sprite').use(require('svg-sprite-loader/plugin')),
      [{ pluginSprite: true }]; //配置插件
    config.module
      .rule('svg')
      .exclude.add(resolve(__dirname, 'src/assets/icons')); //其他svg loader排除 icons目录
  },
  request: {
    dataField: 'data',
  },
  proxy: {
    '/api': {
      target: 'https://api.tntcoincome.com', // 'http://192.168.1.211:8080', //
      changeOrigin: true,
      pathRewrite: {
        '^/api': '',
      },
    },
  },
  // 加快项目启动速度，只需要 dev，这么配
  // mfsu: {},
  // 如果需要针对生产环境生效，这么配
  // mfsu: { production: { output: '.mfsu-production' } },
  dva: {
    // 按需加载
    immer: true,
    // 热重载
    hmr: true,
  },
  alias: {
    themes: resolve(__dirname, './src/themes'),
    '@aImage': resolve(__dirname, './src/assets/image'),
  },
  // 将 ClassName 类名变成驼峰命名形式
  cssLoader: {
    localsConvention: 'camelCase',
  },
  lessLoader: {
    // modifyVars: {
    //   hack: "true; @import '~themes/index.less';@lwl: red;"
    // }
    // modifyVars: {
    //   "@ctc-bg-3": 'red'
    // },
    javascriptEnabled: true,
  },
  nodeModulesTransform: {
    type: 'none',
  },
  fastRefresh: {},
});
