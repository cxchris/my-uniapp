import { createApp } from "vue";
import App from "./App.vue";
import store from './store'; // 导入 Vuex store

const app = createApp(App);
app.use(store); // 使用 Vuex store
app.mount("#app");
