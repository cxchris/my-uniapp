// store/index.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    list: [], // 初始化通知栏消息列表
    msg: null, // 初始化为 null，将在需要的时候更新
  },
  mutations: {
    updateList(state, newList) {
      state.list = newList;
    },
    updateMsg(state, newMsg) {
      state.msg = newMsg;
    },
  },
  actions: {
    // 可以定义异步操作
  },
  modules: {
    // 可以将 store 拆分成多个模块
  },
});
