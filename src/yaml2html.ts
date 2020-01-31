
const styleTable = "style='border:none; border-collapse:collapse;'";
const styleTd = "style='background-color:#ffffff; padding:5px; border:1px solid silver; border-collapse:collapse;'";
const styleTh = "style='white-space:normal; background-color:#eeeeee; padding:5px; width:70px; border:1px solid silver; border-collapse:collapse; vertical-align:top'";

export function yaml2html(yamlObj: Object) {

    let body: string = "";

    body += "<table " + styleTable + ">";
    body = convert(yamlObj, body);
    body += "</table>";

    return body;
}

export function convert(item: any, body: string) {

    if (item instanceof Array) {

        let itemVal: any = item[0];

        // 値がオブジェクトの場合
        if (itemVal instanceof Object) {
            body = createlistTable(item, body);

        } else {
            // 値が文字列要素の場合
            for (let idx in item) {
                body += "<li>" + item[idx] + "</li>";
            }
        }

    } else {
        for (let itemKey in item) {
            let itemVal = item[itemKey];

            // 値がオブジェクトの場合
            if (itemVal instanceof Object) {
                body += "<tr><th " + styleTh + ">" + itemKey + "</th>";
                body += "<td " + styleTd + "><table " + styleTable + ">";
                body = convert(itemVal, body);
                body += "</table></td></tr>";

            } else {
                // 値が文字列要素の場合
                body += "<tr><th " + styleTh + ">" + itemKey + "</th>";
                body += "<td " + styleTd + ">" + itemVal + "</td></tr>";
            }
        }
    }
    return body;
}

// Hash の List については一覧表を作る
export function createlistTable(item: any, body: string) {

    // 重複しないキーのリストを作成
    var childKeyList: string[] = new Array();
    for (let idx in item) {

        let itemVal: any = item[idx];
        let child: any = itemVal;

        for (let childKey in child) {
            if (childKeyList.indexOf(childKey) == -1) {
                childKeyList.push(childKey);
            }
        }
    }

    body += "<table " + styleTable + "><tr>";

    // テーブルヘッダ部
    for (let idx in childKeyList) {
        body += "<th " + styleTh + ">" + childKeyList[idx] + "</th>";
    }

    body += "</tr>";

    // テーブルデータ部
    for (let idx in item) {

        let childHash: any = item[idx];
        body += "<tr>";

        for (let idx in childKeyList) {

            let childVal = childHash[childKeyList[idx]];

            // 子階層がオブジェクトの場合は再帰呼び出し
            if (childVal instanceof Object) {
                body += "<td " + styleTd + ">";
                body += "<table " + styleTable + ">";
                body = convert(childVal, body);
                body += "</table></td>";
            } else {

                body += "<td " + styleTd + ">" + childVal + "</td>";
            }
        }
        body += "</tr>";

    }

    return body;
}