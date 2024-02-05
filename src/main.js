// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import { Tag, Upload, Button, Input, Message, Table, TableColumn } from 'element-ui';

Vue.config.productionTip = false

Vue.component(Tag.name, Tag);
Vue.component(Upload.name, Upload);
Vue.component(Button.name, Button);
Vue.component(Input.name, Input);
Vue.component(Table.name, Table);
Vue.component(TableColumn.name, TableColumn);

Vue.prototype.$message = Message;
// Vue.use(ElementUI);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
