<template>
  <view>
    <button type="default" @click="test">是否开启获取通知权限</button>
    <button type="default" @click="set">跳转到设置界面</button>
    <button type="default" @click="clear">清空列表记录</button>
    <button type="default" @click="cancelAll">清空所有通知栏消息</button>
    <text class="log-msg">{{ msg }}</text>
    <uni-section overflow title="卡片标题" type="line">
      <view class="cu-card case" v-for="(item, index) in list" :key="index">
        <text class="log-text">{{ item.content }}</text>
        <br />
        <hr />
      </view>
    </uni-section>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { analyze, getPkgList, modifyList } from '@/utils/utils.js';
import { useStore } from 'vuex'; // 导入 useStore
import { error } from '@/utils/error';

const store = useStore(); // 使用 useStore 获取 store 实例

const msg = ref('收到的通知内容会展示在这里：');

const list = computed(() => store.state.list); // 访问 Vuex 中的 list 状态

let NoticeBarModule;

const test = () => {
  // 实现获取通知权限逻辑
  let res = NoticeBarModule.readNotificationBar();
  if (res) {
    //开启
    uni.showToast({title: '开启',icon: 'none'});
  } else {
    //未开启
    uni.showToast({ title: '未开启', icon: 'none' });
  }
};

const set = () => {
  // 实现跳转到设置界面逻辑
  NoticeBarModule.toSetting();
};

const clear = () => {
  store.commit('updateList', []); // 清空列表记录
};

const cancelAll = () => {
  // 实现清空所有通知栏消息逻辑
  NoticeBarModule.cancelAll(); //无任何返回值
};

//加载后的load main方法
const load = async () => {
  let pkgdata;
  let pkgstatus = 0; //默认是不显示乱七八糟的包的
  try {
    const pkglist = await getPkgList();
    pkgdata = pkglist.data //data
    pkgstatus = pkglist.data.is_show //is_show
    // console.log(pkgstatus)
    if (pkgdata == null || pkgdata == undefined || pkgstatus == undefined) {
      throw error[407];
    }
  } catch (e) {
    modifyList(e.message)

    uni.showModal({
      title: '出错了',
      content: e.message,
      showCancel: false, // 设置为 false 隐藏取消按钮
    });
    console.error(e);
    return;
  }
  
  NoticeBarModule = uni.requireNativePlugin('lu-NoticeBarModule');
  // console.log(pkglist);

  // const msg = {
  //   "content": "账户8762 收款HKD 1.04元。付款人: LIU G****** 账户: ****7782附言: ",
  //   "title": "交易提示",
  //   "pkg": "com.wlb.android",
  //   "notify_time": "2023-07-08 16:25:43"
  // };

  NoticeBarModule.init();

  NoticeBarModule.getNotification(msg => { //<-- e 就是监听到的通知栏消息
    // _this.list.push(e);
    // console.log(JSON.stringify(msg));
    try {
      store.commit('updateMsg', msg);
      analyze(pkgdata);
    } catch (e) {
      //隐藏其他乱七八糟的app的消息，只显示系统银行
      // console.log(e.code)
      if (e.code != 401 || pkgstatus == 1) {
        modifyList(e.message)
        console.error(e);
      }
      // uni.showModal({
      //   title: '出错了',
      //   content: e,
      //   showCancel: false, // 设置为 false 隐藏取消按钮
      // });
    }
  });
}

onMounted(load);
</script>

<style scoped>
.content {
  /* overflow: hidden; */
  width: 100%;
  
}

.text-area {
  display: flex;
  justify-content: center;
  padding: 20rpx;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
.log-text{
  word-break: break-all;
  user-select: text; -webkit-user-select: text;
}
</style>
