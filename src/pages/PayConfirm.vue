<template>
  <div>
    <div class="pay-confirm">
      <div style="display:flex;">
        <el-upload class="upload-demo" ref="upload" action="" :on-preview="handlePreview" :limit="2" accept=".pdf"
          :file-list="fileList" :http-request="handleUpload" :auto-upload="true">
          <el-button slot="trigger" size="small" type="primary" :disabled="fileList.length == 2">选取PDF文件①</el-button>
          <el-button style="margin-left: 10px;" size="small" type="success"
            :disabled="!fileList || fileList.length === 0" @click="ParsePDF">解析PDF②</el-button>

          <div slot="tip" class="el-upload__tip">最多上传两个文件</div>
          <div slot="file"></div>
        </el-upload>
        <el-upload type="warning" action="" :http-request="ImportExcel" size="small" :limit="1" accept=".xlsx"
          :file-list="file2List" :auto-upload="true" style="margin-left: 10px;">
          <!-- :disabled="!PdfDataList || PdfDataList.length === 0" -->
          <el-button slot="trigger" size="small" type="warning"
            :disabled="!PdfDataList || PdfDataList.length === 0">选取要对比的Excel文件③</el-button>
          <el-button style="margin-left: 10px;" size="small" type="success"
            :disabled="(!PdfDataList || PdfDataList.length === 0) || !excelFile"
            @click="ExportExcel">导出Excel④</el-button>
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
      <el-table :data="PdfDataList" border style="width: 100%" height="600" :row-class-name="tableRowClassName">
        <el-table-column prop="Balance" label="差额" fixed :filters="getFilterData()"
          :filter-method="doFilterBalance"></el-table-column>
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
import { pdf2json, deepClone, checkHasPassword, saveToFile, xlsx2Json, SheetNamePattern, getBlobURLWithPassword } from '@/utils/pdf2json.js';
export default {
  name: 'PayConfirm',
  data() {
    return {
      fileList: [],
      file2List: [],
      excelFile: null,
      PdfDataList: []
    }
  },
  created() {
  },
  methods: {
    ImportExcel(e) {
      this.file2List = [];
      this.excelFile = null;
      function mergeDataList(pdfDataList, excelDataList) {

        var result = [];
        const unionData = pdfDataList.map((item) => {
          return {
            MID: item.MID,
            SID: item.SID,
          }
        }).concat(excelDataList.map((item) => {
          return {
            MID: item.MTG_MID,
            SID: item.MTG_SID,
          }
        })).filter((item, index, self) => {
          return self.findIndex(t => t.MID === item.MID && t.SID === item.SID) === index;
        });
        unionData.forEach(item => {
          const pdfItem = pdfDataList.find(pdfItem => pdfItem.MID === item.MID && pdfItem.SID === item.SID);
          const excelItem = excelDataList.find(excelItem => excelItem.MTG_MID === item.MID && excelItem.MTG_SID === item.SID);
          if (!pdfItem) {
            result.push({
              ...excelItem,
              MID: "",
              SID: "",
              SchoolName: "",
              Count: "",
              Fee: "",
              Balance: excelItem.MTG_Fee
            })
          } else if (!excelItem) {
            result.push({
              ...pdfItem,
              MTG_MID: "",
              MTG_SID: "",
              MTG_SchoolName: "",
              MTG_Count: "",
              MTG_Fee: "",
              Balance: 0 - pdfItem.Fee
            })
          } else {
            result.push({
              ...pdfItem,
              ...excelItem,
              Balance: excelItem.MTG_Fee - pdfItem.Fee
            })
          }


        });
        return result;
      }
      var sheetData = [];
      var self = this;
      xlsx2Json(e.file).then((result) => {
        var res = result.find(item => SheetNamePattern.test(item.sheetName));
        if (res) {
          self.excelFile = e.file;

          sheetData = res.sheetData;

          self.PdfDataList = mergeDataList(self.PdfDataList || [], sheetData);
        } else {
          this.$message.error('数据解析失败，请检查文件是否正确');
        }

      });
      return;
    },
    ExportExcel() {

      const header = [['MID', 'SID', 'MTG_学校名', 'タイプ', 'MTG_取扱金額', "Count", 'SBPS_取扱金額', 'SBPS_Count', '差额', "差量"]];
      const exportData = this.PdfDataList.filter(item => item.Balance != 0).map(item => {
        return {
          MID: item.MID,
          SID: item.SID,
          "MTG_SchoolName": item.MTG_SchoolName,
          'MTG_PayType': item.MTG_PayType,
          'MTG_Fee': item.MTG_Fee,
          "MTG_Count": item.MTG_Count,
          'Fee': item.Fee,
          'Count': item.Count,
          'Balance': item.Balance,
          "diffCount": Math.abs(Number(item.MTG_Count) - Number(item.Count))
        }
      });
      exportData.push({
        MID: '总计',
        SID: '',
        "MTG_SchoolName": '',
        'MTG_PayType': '',
        'MTG_Fee': exportData.reduce((prev, item) => prev + Number(item.MTG_Fee), 0),
        "MTG_Count": exportData.reduce((prev, item) => prev + Number(item.MTG_Count), 0),
        'Fee': exportData.reduce((prev, item) => prev + Number(item.Fee), 0),
        'Count': exportData.reduce((prev, item) => prev + Number(item.Count), 0),
        'Balance': exportData.reduce((prev, item) => prev + Number(item.Balance), 0),
        "diffCount": exportData.reduce((prev, item) => prev + Number(item.diffCount), 0)
      })
      saveToFile(header, exportData, `${new Date().getTime()}.xlsx`);
    },
    ParsePDF() {
      this.excelFile = null;
      this.PdfDataList = [];

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
      this.PdfDataList = [];
    },
    handlePreview() { },
    async handleUpload(e) {
      var file = e.file;
      var url = URL.createObjectURL(file);
      // var checkPassword = await checkHasPassword(url)
      var hasUploaded = this.fileList.some((item) => item.name === file.name)
      if (!hasUploaded) {

        this.fileList.push({
          url: url,
          pwd: "",
          name: file.name,
          checkPassword: true,
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
      }).filter((item, index, self) => {
        return self.findIndex(t => t.text === item.text) === index;
      });
    },
    doFilterBalance(value, row) {
      return row.Balance === value;
    },
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

.table-container {
  width: 90%;
  min-width: 1025px;
  margin: 0 auto;
}

.table-container .el-table .warning-row {
  background-color: #E6A23C;
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
