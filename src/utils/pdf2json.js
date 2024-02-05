
import * as XLSX from "xlsx";

export var SheetNamePattern = /^(0?[1-9]|1[0-2])\月\((0?[1-9]|1[0-2])(0?[1-9]|[1-2][0-9]|3[0-1])-(0?[1-9]|1[0-2])(0?[1-9]|[1-2][0-9]|3[0-1])\)$/;
export async function pdf2json(files) {

  async function convertPdfToJson(file) {
    function dealPdfData(pageTexts) {
      var data = pageTexts.sort(function (a, b) {
        return a.pageNumber - b.pageNumber;
      }).map(item => {
        var startIndex = item.items.findIndex(item => item.str === '税込金額');
        var endIndex = item.items.findIndex(item => item.str === '合計');
        var items = item.items;
        if (endIndex > -1) {
          items = items.filter((item, index) => index < endIndex);
        }
        items = items.filter((item, index) => index > startIndex);
        return items;
      }).reduce((prev, current) => {
        return prev.concat(current);
      }, []).map(function (item) {
        return {
          x: item.transform[5],
          y: item.transform[4],
          hasEOL: item.hasEOL,
          ...item,
        }
      });
      var rows = [];
      var row = {
        MID: "",
        SID: "",
        SchoolName: "",
        Count: 0,
        Fee: 0
      };
      data.forEach((item, index) => {
        var value = item.str.trim();
        var x = item.x;
        if (x == 21 && value) {
          if (row.MID) {
            rows.push(row);
            row = {
              MID: "",
              SID: "",
              SchoolName: "",
              Count: 0,
              Fee: 0,
            };
          }
          row.MID = value;
        }
        else if (x == 51) {
          row.SID = value;
        }
        else if (x < 410 && x > 380) {
          value = value.replace(/,/g, "");
          value = Number(value);
          if (!isNaN(value)) {
            if (row.Count == 0) {
              row.Count = value;
            }
            else {
              row.Count += value;
            }
          }

        }
        else if (x < 475 && x > 415) {
          value = value.replace(/,|¥/g, "");
          value = Number(value);
          if (!isNaN(value)) {
            if (row.Fee == 0) {
              row.Fee = value;
            }
            else {
              row.Fee += value;
            }
          }
        }
        else if (x < 180 && x > 100) {
          row.SchoolName || (row.SchoolName = value);
        }
        if (index == data.length - 1) {
          rows.push(row);
          row = {
            MID: "",
            SID: "",
            SchoolName: "",
            Count: 0,
            Fee: 0,
          };
        }
      });
      return rows;
    }
    return await new Promise((resolve, reject) => {
      // 使用 PDF.js 进行解析
      pdfjsLib.getDocument({ url: file.url, password: file.pwd }).promise.then(async function (pdf) {
        // 通过循环获取每一页的文本
        const promises = Array.from({ length: pdf.numPages }, async (_, i) => {

          var page = await pdf.getPage(i + 1);
          var t = await page.getTextContent();
          t["pageNumber"] = page.pageNumber;
          return t;
        });

        // 处理所有页面的文本
        var pageTexts = await Promise.all(promises)
        var data = dealPdfData(pageTexts) || [];
        resolve(data);
      });
    });
  }

  var execute = async function (files) {

    let dataList = [];
    for (const item of files) {
      var data = await convertPdfToJson(item);
      dataList = dataList.concat(data);
    }
    var data = dataList.sort(function (a, b) {
      if (a.MID != b.MID) {
        return a.MID - b.MID;
      }
      return a.SID - b.SID;
    }).filter(item => item.Fee > 0);
    return data
  }
  if (files && files.length > 0) {
    return await execute(files);
  } else {
    throw new Error('files is empty');
  }
};

export function deepClone(arr) {

  return arr.map(function (item) {
    return {
      ...item
    };
  });
}
export function checkHasPassword(url) {
  return new Promise((resolve, reject) => {

    pdfjsLib.getDocument({ url: url, password: "" }).promise.then(res => {
      resolve(false);
    }).catch(err => {
      resolve(true);
    });
  });
}
export function saveToFile(header, data, fileName) {

  // 将JS数据数组转换为工作表。
  const headerWs = XLSX.utils.aoa_to_sheet(header);
  const ws = XLSX.utils.sheet_add_json(headerWs, data, { skipHeader: true, origin: 'A2' });


  /* 新建空的工作表 */
  const wb = XLSX.utils.book_new();
  // 可以自定义下载之后的sheetname
  XLSX.utils.book_append_sheet(wb, ws, 'sheet1');
  /* 生成xlsx文件 */
  XLSX.writeFile(wb, fileName);
}

/**
 * 导入Excel到Json
 * @param {String} file: blob:https://www.example.com/xxxx
 * @returns any[]
 */
export function xlsx2Json(file) {

  return new Promise(function (resolve, reject) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const data = e.target.result
      this.wb = XLSX.read(data, {
        type: 'binary'
      })
      const result = []
      this.wb.SheetNames.forEach((sheetName, index) => {
        var sheetData = XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName]);
        if (SheetNamePattern.test(sheetName)) {
          sheetData = sheetData.map(item => {

            return {
              "MTG_MID": item.MID,
              "MTG_SID": item.SID,
              MTG_SchoolName: item["学校名"],
              MTG_Count: item["件数"],
              MTG_Fee: item["取扱金額"]
            }

          });
        }
        result.push({
          sheetName: sheetName,
          sheetData: sheetData
        })
      })
      resolve(result)
    }
    reader.readAsBinaryString(file);
  })
  // reader.readAsBinaryString(file) // 传统input方法
};
