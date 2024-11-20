import {
  bitable,
  FieldType,
  IOpenCellValue,
  IOpenDocumentMentionSegment,
  IOpenSegment,
  IOpenSegmentType,
  IOpenUrlSegment,
} from "@base-open/web-api";
import { ErrorType, UrlArr, UrlRegExp } from "./constants";

export interface UrlValueInfo {
  value: string;
  errorType?: ErrorType;
}

/**
 * 根据字段类型，获取字段内容中的链接
 */
export function getFieldUrlValue(
  fieldType: FieldType,
  value: IOpenCellValue
): UrlValueInfo {
  switch (fieldType) {
    case FieldType.Lookup:
    case FieldType.Formula:
    case FieldType.Barcode:
    case FieldType.Text: {
      let validUrl = "";
      (value as IOpenSegment[])?.some?.((item) => {
        if (
          item.type === IOpenSegmentType.Url ||
          item.type === IOpenSegmentType.Mention
        ) {
          const url =
            (item as IOpenDocumentMentionSegment | IOpenUrlSegment).link ||
            item.text;
          const isUrlValid = UrlRegExp.test(url);
          if (isUrlValid) {
            validUrl = url;
          }
          return isUrlValid;
        } else if (item.type === IOpenSegmentType.Text && item.text) {
          const isTextAsUrl = UrlRegExp.test(item.text);
          // 如果展示文本符合url规则，则把展示文本当作url使用
          if (isTextAsUrl) {
            validUrl = item.text;
          }
          return isTextAsUrl;
        }
      });
      // 针对多行文本，仅当记录内容完全为空的时候才展示没有记录内容
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return { value: validUrl, errorType: ErrorType.NO_URL_CONTENT };
      } else if (!validUrl) {
        return {
          value: validUrl,
          errorType: ErrorType.URL_FORMAT_ERROR,
        };
      }
      return { value: validUrl };
    }
    case FieldType.Url: {
      const url =
        (value as IOpenUrlSegment[])?.[0]?.link ||
        (value as IOpenUrlSegment[])?.[0]?.text;
      if (!url) {
        return { value: url, errorType: ErrorType.NO_URL_CONTENT };
      } else if (!UrlRegExp.test(url)) {
        return {
          value: url,
          errorType: ErrorType.URL_FORMAT_ERROR,
        };
      }
      return { value: url };
    }
    default:
      return { value: "", errorType: ErrorType.FIELD_TYPE_NOT_SUPPORT };
  }
}

export function getFieldText(
  fieldType: FieldType,
  value: IOpenCellValue
): UrlValueInfo {
  switch (fieldType) {
    case FieldType.Lookup:
    case FieldType.Formula:
    case FieldType.Barcode:
    case FieldType.Text: {
      let validUrl = "";
      (value as IOpenSegment[])?.some?.((item) => {
        if (
          item.type === IOpenSegmentType.Url ||
          item.type === IOpenSegmentType.Mention
        ) {
          const url =
            (item as IOpenDocumentMentionSegment | IOpenUrlSegment).link ||
            item.text;
          const isUrlValid = UrlArr.test(url);
          if (isUrlValid) {
            validUrl = url;
          }
          return isUrlValid;
        } else if (item.type === IOpenSegmentType.Text && item.text) {
          const isTextAsUrl = UrlArr.test(item.text);
          // 如果展示文本符合url规则，则把展示文本当作url使用
          if (isTextAsUrl) {
            validUrl = item.text;
          }
          return isTextAsUrl;
        }
      });
      // 针对多行文本，仅当记录内容完全为空的时候才展示没有记录内容
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return { value: validUrl, errorType: ErrorType.NO_URL_CONTENT };
      } else if (!validUrl) {
        return {
          value: validUrl,
          errorType: ErrorType.URL_FORMAT_ERROR,
        };
      }
      return { value: validUrl };
    }
    case FieldType.Url: {
      const url =
        (value as IOpenUrlSegment[])?.[0]?.link ||
        (value as IOpenUrlSegment[])?.[0]?.text;
      if (!url) {
        return { value: url, errorType: ErrorType.NO_URL_CONTENT };
      } else if (!UrlArr.test(url)) {
        return {
          value: url,
          errorType: ErrorType.URL_FORMAT_ERROR,
        };
      }
      return { value: url };
    }
    default:
      return { value: "", errorType: ErrorType.FIELD_TYPE_NOT_SUPPORT };
  }
}