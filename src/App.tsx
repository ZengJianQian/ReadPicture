import "./App.css";
import { useEffect, useState } from "react";
import { bitable, Selection } from "@base-open/web-api";
import { getFieldUrlValue } from "./utils";
import { getFieldText } from "./utils";
import { Preview } from "./preview";
import { Spin } from "@douyinfe/semi-ui";
import { DisabaledWeb } from "@icon-park/react";
import { ErrorTips, ErrorType } from "./constants";

async function getUrlFromSelection(selection: Selection) {
  const { recordId, tableId, fieldId } = selection;
  if (!tableId || !recordId || !fieldId) return;
  const table = await bitable.base.getTableById(tableId);
  const cellValue = await table.getCellValue(fieldId, recordId);
  const field = await table.getFieldById(fieldId);
  const fieldType = await field.getType();
  return getFieldUrlValue(fieldType, cellValue);
}
async function getTextFromSelection(selection: Selection) {
  const { recordId, tableId, fieldId } = selection;
  if (!tableId || !recordId || !fieldId) return;
  const table = await bitable.base.getTableById(tableId);
  const cellValue = await table.getCellValue(fieldId, recordId);
  const field = await table.getFieldById(fieldId);
  const fieldType = await field.getType();
  return getFieldText(fieldType, cellValue);
}

export default function App() {
  const [url, setUrl] = useState("");
  const [errorType, setErrorType] = useState<ErrorType | string>(
    ErrorType.NO_SELECT_RECORD
  );
  const [loading, setLoading] = useState(false);
  var [tex, setTex] = useState("");

  bitable.base.getSelection().then((selection) => {
    if (!selection.recordId) {
      setErrorType(ErrorType.NO_SELECT_RECORD);
    } else {
      getUrlFromSelection(selection).then((info) => {
        setUrl(info?.value || "");
        setErrorType(info?.errorType || "");
      });
      getTextFromSelection(selection).then((info) => {
        setTex(info?.value || "");
      });
    }
  });
  useEffect(() => {
    return bitable.base.onSelectionChange((event) => {
      const selection = event.data;
      if (!selection.recordId) {
        setErrorType(ErrorType.NO_SELECT_RECORD);
      }
      setLoading(true);
      getTextFromSelection(selection).then((info) => {
        setTex(info?.value || "");
      });
      getUrlFromSelection(selection).then((info) => {
        setUrl(info?.value || "");
        if (!info?.value) {
          setLoading(false);
        }
      });
    });
  }, []);

  return (
    <main>
      {url ? (
        <Preview onLoad={() => setLoading(false)} url={url} text={tex} />
      ) : (
        <div className="content-tips-container">
          <div className="content-tips">
            <DisabaledWeb theme="outline" size="36" fill="#333" />
            <span className="content-tips-text">
              {errorType ? ErrorTips[errorType as ErrorType] : "无可预览的内容"}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="content-loading-bg">
          <div className="content-loading-container">
            <Spin size="large" tip={"加载中..."}></Spin>
          </div>
        </div>
      )}
    </main>
  );
}
