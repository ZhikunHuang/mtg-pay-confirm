<template>
  <div class="pay-confirm">
    <el-upload class="upload-demo" ref="upload" action="" :on-preview="handlePreview" :on-remove="handleRemove" :limit="2"
      accept=".pdf" :file-list="fileList" :http-request="handleUpload" :auto-upload="true">
      <el-button slot="trigger" size="small" type="primary">选取文件</el-button>
      <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload">数据对比</el-button>

      <div slot="file" slot-scope="{file}">
        <div class="file-name">
          <div>
            <label>文件名：</label><el-tag :title="file.name"> {{ file.name }} </el-tag>
          </div>
          <el-tag style="margin-top: 5px; margin-left: 70px;width: fit-content;padding: 0;height: 0;"
            v-show="file.isShowError"></el-tag>
        </div>
        <div class="pwd">
          <div>
            <label>文件密码：</label><el-input size="small" v-model="file.pwd" placeholder="没有不填"></el-input>
          </div>
          <el-tag type="danger" size="mini" style="margin-top: 5px; margin-left: 70px;width: fit-content;"
            v-show="file.isShowError">请输入密码</el-tag>
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script>
import { pdf2json, deepClone } from '@/utils/pdf2json.js'
export default {
  name: 'PayConfirm',
  data() {
    return {
      fileList: []
    }
  },
  created() {
  },
  methods: {
    submitUpload() {
      if (this.fileList) {
 
        var isAnyNoPwd = this.fileList.some(item => !item.pwd);
        if (!isAnyNoPwd) {
          this.pdf2json()
        } else {
          this.fileList = deepClone(this.fileList.map(item => {
            return {
              isShowError: !item.pwd,
              ...item
            }
          }));
        }
      }
      return;
    },
    handleRemove() { },
    handlePreview() { },
    handleUpload(e) {
      var file = e.file;
      var url = URL.createObjectURL(file);
      var hasUploaded = this.fileList.some((item) => item.name === file.name)
      if (!hasUploaded) {

        this.fileList.push({
          url: url,
          pwd: "",
          name: file.name
        })
      }
      
      this.fileList = deepClone(this.fileList.map(item => {
            return {
              isShowError: !item.pwd,
              ...item
            }
          }));
    },
    pdf2json: async function () {
      var data = await pdf2json(deepClone(this.fileList));
      console.log(data);
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
label {
  display: inline-block;
}

.pay-confirm {
  width: 600PX;
  margin: 0 auto;
}

.upload-demo {
  text-align: left;
}

.file-name {
  display: flex;
}

.file-name>div {

  display: inline-flex;
  align-items: center;
}

.file-name>div,
.file-name>span {
  flex: 1;
}

.el-upload-list li>div {
  display: flex;
  align-items: flex-start;
}

.el-upload-list li>div>div {
  display: inline-flex;
  flex: 1;
  flex-direction: column;
}

.el-upload-list .el-input {
  width: 150px;
}

.el-upload-list .el-tag {
  display: inline-block;
  width: 200PX;
  margin-right: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
</style>
