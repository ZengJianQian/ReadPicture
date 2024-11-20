/**
 * 解析匹配规则：
 * 0 - 链接全部
 * 1 - https+domain
 * 末位 - path+query
 */
export const UrlRegExp = new RegExp(
  /(https:\/\/([a-zA-Z0-9]|[一-龟]|-)+(\.([a-zA-Z0-9]|[一-龟]|-)+)+)(\/.*)?/
  // /(https:\/\/([a-zA-Z0-9]|[一-龟]|-)+(\.([a-zA-Z0-9]|[一-龟]|-)+)+)(\/.*).[a-zA-Z0-9]{2,5}/
  //原版网址匹配：   /^(https:\/\/([a-zA-Z0-9]|[一-龟]|-)+(\.([a-zA-Z0-9]|[一-龟]|-)+)+)(\/.*)?$/
);
export const UrlArr = new RegExp(
  /(https:\/\/([a-zA-Z0-9]|[一-龟]|-)+(\.([a-zA-Z0-9]|[一-龟]|-)+)+)(\/([a-zA-Z0-9]|[一-龟]|-)+)+\.[a-zA-Z0-9]{2,5}/
);

export enum ErrorType {
  /** 没有选中单元格 */
  NO_SELECT_RECORD = "no select record",
  /** 字段变更：从可容纳链接的字段变成无法容纳超链接的字段 */
  FIELD_TYPE_NOT_SUPPORT = "field type not support",
  /** 内容为空：当前 item 中，绑定的字段没有内容 */
  NO_URL_CONTENT = "no url content",
  /** url 不符合规则：字段类型为「支持获取链接的类型」，内容不符合 url 格式 */
  URL_FORMAT_ERROR = "url format error",
}

export const ErrorTips: Record<ErrorType, string> = {
  [ErrorType.NO_SELECT_RECORD]:
    "当前没有选中单元格，选中一个单元格后自动加载预览",
  [ErrorType.FIELD_TYPE_NOT_SUPPORT]: "当前单元格所在的字段类型不支持", // 针对字段类型不支持的
  [ErrorType.NO_URL_CONTENT]: "当前单元格的内容为空，请选择其他单元格预览", // 针对单元格没有内容
  [ErrorType.URL_FORMAT_ERROR]:
    "当前单元格没有 URL 或 URL 不符合格式要求，请选择其他单元格", //针对单元格有内容但是没有可以解析的url
};
