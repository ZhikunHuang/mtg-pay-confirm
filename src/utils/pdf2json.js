
export async function pdf2json(files) {

  async function convertPdfToJson(file) {
    function dealPdfData(pageTexts) {
      var data = pageTexts.reduce((prev, current) => {
        return prev.concat(current);
      }, []).map(function (item) {
        return {
          x: item.transform[5],
          y: item.transform[4],
          hasEOL: item.hasEOL,
          ...item,
        }
      }).filter(item => item.width > 0 && item.x < 465);
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
        if (x == 21) {
          if (row.MID != "" && row.SID != "") {
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
          value = JSON.parse(value);
          if (row.Count == 0) {
            row.Count = value;
          }
          else {
            row.Count += value;
          }
        }
        else if (x < 465 && x > 440) {
          value = value.replace(/,|¥/g, "");
          value = JSON.parse(value);
          if (row.Fee == 0) {
            row.Fee = value;
          }
          else {
            row.Fee += value;
          }
        }
        else if (x == 151) {
          row.SchoolName = value;
        }
        if (index == data.length - 1) {
          rows.push(row);
        }
      });
      return rows.sort(function (a, b) {
        if (a.MID != b.MID) {
          return a.MID - b.MID;
        }
        return a.SID - b.SID;
      });
    }
    return await new Promise((resolve, reject) => {
      // 使用 PDF.js 进行解析
      pdfjsLib.getDocument({ url: file.url, password: file.pwd }).promise.then(async function (pdf) {
        // 通过循环获取每一页的文本
        const promises = Array.from({ length: pdf.numPages }, (_, i) => {
          return pdf.getPage(i + 1).then(async function (page) {
            var text = await page.getTextContent();
            var startIndex = text.items.findIndex(item => item.str === '取扱金額');
            return text.items.filter((item, index) => index > startIndex);
          });
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
    return dataList;
  }
  if (files && files.length > 0) {
    return await execute(files);
  } else {
    throw new Error('files is empty');
  }
};
