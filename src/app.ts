import type { RequestConfig } from 'umi';
import { message } from 'antd';
import { ErrorShowType } from 'umi';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import type { RequestOptionsInit } from 'umi-request';
import { history } from 'umi';
import { getApp } from './.umi/plugin-dva/dva';

// 这个是redux-persist 的配置
const persistConfig = {
  key: 'root', // 自动框架生产的根目录id 是root。不变
  storage, // 这个是选择用什么存储，session 还是 storage
  whitelist: ['user', 'default'],
};
const persistEnhancer =
  () =>
  (createStore: any) =>
  (reducer: any, initialState: any, enhancer: any) => {
    const store = createStore(
      persistReducer(persistConfig, reducer),
      initialState,
      enhancer,
    );
    const persist = persistStore(store);
    return { ...store, persist };
  };

// 配置dva redux-persiti 持久化
export const dva = {
  config: {
    extraEnhancers: [persistEnhancer()],
    // onReducer(reducer: any) {
    //   const persistConfig = {
    //     key: 'root',
    //     storage,
    //     whitelist: ['user', 'default'],
    //   };
    //   return persistReducer(persistConfig, reducer);
    // },
  },
};

// 配置请求拦截
const ErrorCodeMsg: any = {
  default: '请求错误',
  401: '登录失效',
  500: '接口出错',
  503: '服务错误',
  400: '参数错误',
};

// token黑名单，处于里面的请求不携带token
const tokenBlackList = [
  '/coin-trade-socket/web/socket/getRandomSocketAddress',
  '/coin-trade-market/web/market/overview',
  '/coin-trade-market/web/market/symbol-thumb-trend',
  '/coin-trade-market/web/exchange-rate/usdt/cny',
  // 字典
  '/system/dict/data/dictType/',
  // 系统参数
  '/system/config/configKey/',
];

export const request: RequestConfig = {
  timeout: 20000, // 请求超时时间
  errorConfig: {
    // 这边处理状态码不为200的请求
    adaptor(resData) {
      return {
        success: resData.code == 'success',
        showType: ErrorShowType.SILENT,
      };
    },
  },
  // 请求拦截
  requestInterceptors: [
    async (url: string, options: RequestOptionsInit) => {
      const { user } = getApp()._store.getState();
      if (user) {
        if (!tokenBlackList.find((u) => url.includes(u))) {
          if (user.oauthToken) {
            options.headers = {
              ...options.headers,
              Authorization: `${user.oauthToken.token_type} ${user.oauthToken.access_token}`,
            };
          }
        }
      }
      return { url: '/api' + url, options };
    },
  ] as any,
  // 响应拦截
  responseInterceptors: [
    async (response) => {
      // 下面处理data.code不为success的请求
      let data = null;
      try {
        data = await response.clone().json();
      } catch {
        console.error(response);
      }
      if (response.status === 200 && data) {
        if (data.code === 'success') {
          return response;
        }
      } else if (response.status === 401) {
        // 退出登录
        getApp()._store.dispatch({
          type: 'user/logout',
        });
        // 跳转登录
        history.push('/login');
      }

      message.error({
        content:
          data?.msg || ErrorCodeMsg[response.status] || ErrorCodeMsg['default'],
      });

      return Promise.reject({
        data,
        info: {
          showType: ErrorShowType.SILENT,
        },
      });
    },
  ],
};
