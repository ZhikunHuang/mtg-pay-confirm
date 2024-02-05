<template>
  <div class="pay-confirm">
    <el-upload class="upload-demo" ref="upload" action="" :on-preview="handlePreview" :limit="2" accept=".pdf"
      :file-list="fileList" :http-request="handleUpload" :auto-upload="true">
      <el-button slot="trigger" size="small" type="primary" :disabled="fileList.length == 2">选取PDF文件</el-button>
      <el-button style="margin-left: 10px;" size="small" type="success" :disabled="!fileList || fileList.length === 0"
        @click="submitUpload">导出Excel</el-button>

      <div slot="tip" class="el-upload__tip">最多上传两个文件</div>
      <div slot="file"></div>
    </el-upload>
    <div class="file-list-container">
      <div v-for="(file, index) in fileList" :key="file.url" style="margin-top:10px;">
        <div class="file-name">
          <div>
            <label>文件名{{ index + 1 }}：</label>
            <el-tag :title="file.name"> {{ file.name }} </el-tag>
            <i class="el-icon-close" style="cursor: pointer;color:red" @click="removeFile(file)"></i>
          </div>
          <el-tag style="margin-top: 5px; margin-left: 70px;width: fit-content;padding: 0;height: 0;"
            v-show="file.isShowError"></el-tag>
        </div>
        <div class="pwd" v-show="file.checkPassword">
          <div>
            <label>密码：</label>
            <el-input size="small" v-model="file.pwd" placeholder="PDF密码"></el-input>
          </div>
          <span type="danger" size="mini"
            style="margin-top: 5px; font-size:12px; color:red; margin-left: 55px;width: fit-content;"
            v-show="file.checkPassword && !file.pwd">请输入密码</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { pdf2json, deepClone, checkHasPassword, saveToFile } from '@/utils/pdf2json.js';
export default {
  name: 'PayConfirm',
  data() {
    return {
      fileList: [],
      isLoading: false,
    }
  },
  created() {
  },
  methods: {
    submitUpload() {
      if (this.fileList) {
        var isAnyNoPwd = this.fileList.some(item => !item.pwd && item.checkPassword);
        if (!isAnyNoPwd) {
          this.pdf2json()
        }
      }
      return;
    },
    removeFile(file) {
      this.fileList = this.fileList.filter(item => item.name !== file.name)
      URL.revokeObjectURL(file.url);

    },
    handlePreview() { },
    async handleUpload(e) {
      var file = e.file;
      var url = URL.createObjectURL(file);
      var checkPassword = await checkHasPassword(url)
      var hasUploaded = this.fileList.some((item) => item.name === file.name)
      if (!hasUploaded) {

        this.fileList.push({
          url: url,
          pwd: "",
          name: file.name,
          checkPassword: checkPassword,
        })
      }

    },
    async pdf2json() {
      try {
        var data = await pdf2json(deepClone(this.fileList));
        if (!data || data.some(item => !item.MID)) {
          this.$message.error('数据解析失败，请检查文件是否正确');
          return;
        }
        const header = [['MID', 'SID', '学校名', 'Count', 'Fee']];
        saveToFile(header, data, `${new Date().getTime()}.xlsx`);
      } catch (error) {
        this.$message.error('数据解析失败');
      }
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
  width: 610PX;
  margin: 0 auto;
}

.upload-demo {
  text-align: left;
}

.file-name {
  display: flex;
  margin-right: 15px;
}

.file-name>div {

  display: inline-flex;
  align-items: center;
}

.file-name>div,
.file-name>span {
  flex: 1;
}

.file-list-container {
  text-align: left;
}

.file-list-container>div {
  display: flex;
  align-items: flex-start;
}

.file-list-container>div>div {
  display: inline-flex;
  flex: 1;
  flex-direction: column;
}

.file-list-container .el-input {
  width: 150px;
}

.file-list-container .el-tag {
  display: inline-block;
  width: 200PX;
  margin-right: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
</style>
