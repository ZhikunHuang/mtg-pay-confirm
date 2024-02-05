<template>
  <div>
    <div class="pay-confirm">
      <div style="display:flex;">
        <el-upload class="upload-demo" ref="upload" action="" :on-preview="handlePreview" :limit="2" accept=".pdf"
          :file-list="fileList" :http-request="handleUpload" :auto-upload="true">
          <el-button slot="trigger" size="small" type="primary" :disabled="fileList.length == 2">选取PDF文件</el-button>
          <el-button style="margin-left: 10px;" size="small" type="success" :disabled="!fileList || fileList.length === 0"
            @click="ParsePDF">解析PDF</el-button>
          <el-button style="margin-left: 10px;" size="small" type="success"
            :disabled="!PdfDataList || PdfDataList.length === 0" @click="ExportExcel">导出Excel</el-button>
          <div slot="tip" class="el-upload__tip">最多上传两个文件</div>
          <div slot="file"></div>
        </el-upload>
        <el-upload type="warning" action="" :http-request="ImportExcel" size="small" :limit="1" accept=".xlsx"
          :file-list="file2List" :auto-upload="true" style="margin-left: 10px;">
          <!-- :disabled="!PdfDataList || PdfDataList.length === 0" -->
          <el-button slot="trigger" size="small" type="warning">选取要对比的Excel文件</el-button>
          <div slot="file"></div>
        </el-upload>
      </div>
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
    <div class="table-container">
      <br />
      <el-table :data="PdfDataList" border style="width: 100%" height="600" :row-class-name="tableRowClassName"
        :filter-method="filterBalance">
        <el-table-column prop="Balance" label="差额" fixed :filters="getFilterData()"></el-table-column>
        <el-table-column label="PDF">
          <el-table-column prop="MID" label="MID" width="100">
          </el-table-column>
          <el-table-column prop="SID" label="SID" width="80">
          </el-table-column>
          <el-table-column prop="SchoolName" label="学校名" width="150">
          </el-table-column>
          <el-table-column prop="Count" label="Count" width="150">
          </el-table-column>
          <el-table-column prop="Fee" label="Fee">
          </el-table-column>
        </el-table-column>
        <el-table-column label="MTG">
          <el-table-column prop="MTG_MID" label="MID" width="100">
          </el-table-column>
          <el-table-column prop="MTG_SID" label="SID" width="80">
          </el-table-column>
          <el-table-column prop="MTG_SchoolName" label="学校名" width="150">
          </el-table-column>
          <el-table-column prop="MTG_Count" label="Count" width="150">
          </el-table-column>
          <el-table-column prop="MTG_Fee" label="Fee">
          </el-table-column>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { pdf2json, deepClone, checkHasPassword, saveToFile, xlsx2Json, SheetNamePattern } from '@/utils/pdf2json.js';
export default {
  name: 'PayConfirm',
  data() {
    return {
      fileList: [],
      file2List: [],
      montageFileList: null,

      PdfDataList: []
    }
  },
  created() {
  },
  methods: {
    ImportExcel(e) {
      function mergeDataList(baseData, mergeData) {
        var result = [];
        baseData.forEach((item, index) => {
          var mergeItem = mergeData.find(mtgItem => mtgItem.MTG_MID == item.MID && mtgItem.MTG_SID == item.SID);
          if (mergeItem) {
            result.push({
              ...item,
              ...mergeItem,
              Balance: item.Fee - mergeItem.MTG_Fee
            })
          } else {
            result.push({
              ...item,
              MTG_MID: "",
              MTG_SID: "",
              MTG_SchoolName: "",
              MTG_Count: "",
              MTG_Fee: "",
              Balance: item.Fee
            })
          }
        })
        return result;
      }
      var url = URL.createObjectURL(e.file);
      this.montageFileList = url
      var sheetData = [];
      var self = this;
      xlsx2Json(e.file).then((result) => {
        sheetData = result.find(item => SheetNamePattern.test(item.sheetName)).sheetData;
        if (!self.PdfDataList || self.PdfDataList.length === 0) {
          self.PdfDataList = sheetData
        } else {
          if (self.PdfDataList.length == sheetData.length) {
            self.PdfDataList = mergeDataList(self.PdfDataList, sheetData);
          } else {
            sheetData.length > self.PdfDataList.length ?
              self.PdfDataList = mergeDataList(sheetData, self.PdfDataList) :
              self.PdfDataList = mergeDataList(self.PdfDataList, sheetData);
          }
        }

      });
    },
    ExportExcel() {

      const header = [['MID', 'SID', '学校名', 'Count', 'Fee']];
      saveToFile(header, this.PdfDataList, `${new Date().getTime()}.xlsx`);
    },
    ParsePDF() {
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

      this.PdfDataList = [];
      try {
        var data = await pdf2json(deepClone(this.fileList));
        if (!data || data.some(item => !item.MID)) {
          this.$message.error('数据解析失败，请检查文件是否正确');
          return;
        }
        this.PdfDataList = data;
      } catch (error) {
        this.$message.error('数据解析失败');
      }
    },
    tableRowClassName({ row, rowIndex }) {
      if (row.Balance != 0) {
        return 'warning-row';
      }
      return '';
    },
    getFilterData() {
      return this.PdfDataList.map((item) => {
        return {
          text: item.Balance,
          value: item.Balance
        }
      })
    },
    filterBalance(value, row) {
      return row.Balance === Balance;
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
label {
  display: inline-block;
}

.el-table .warning-row {
  background: oldlace;
}

.pay-confirm {
  width: 610PX;
  margin: 0 auto;
}

.table-container {
  width: 90%;
  min-width: 1025px;
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
  height: 130px;
  border: 1px solid #dcdfe6;
  padding: 0 0 0 5px;
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
