import { useEffect } from "react";
import { UrlRegExp } from "./constants";
import { UrlArr } from "./constants";
interface PreviewProps {
  url: string;
  text: string;
  onLoad: () => void;
}

enum Suite {
  sheet = "sheets",
  doc = "docs",
  docx = "docx",
  bitable = "base",
  note = "mindnotes",
  wiki = "wiki",
}

const suiteDomains = [
  "feishu.cn",
  "feishu.net",
  "feishu-boe.cn",
  "feishu-boe.net",
  "larksuite.com",
];

const getHeaderQuery = (url: string) => {
  const res = UrlRegExp.exec(url);
  if (!res) {
    return null;
  }
  const domain = res[1]?.split("//")?.[1];
  // 判断是否是云文档，如果是的话，需要隐藏头部和侧边栏
  const isSuiteDomain = suiteDomains.some((suiteDomain) =>
    domain.endsWith(suiteDomain)
  );
  if (isSuiteDomain) {
    const path = res[res.length - 1]?.split("/");
    const suiteName = path?.[1];
    const pathEnd = path ? path[path.length - 1] : "";
    const query = pathEnd?.split("?")[1];
    let hideHeader = "lark=1&hideHeader=1";
    if (query) {
      hideHeader = "&" + hideHeader;
    } else {
      hideHeader = "?" + hideHeader;
    }
    if (suiteName === Suite.bitable) {
      return hideHeader + "&hideSidebar=1";
    } else if (suiteName === Suite.wiki) {
      return hideHeader + "&hideSider=1";
    } else if (
      [Suite.sheet, Suite.doc, Suite.docx, Suite.note].includes(
        suiteName as Suite
      )
    ) {
      return hideHeader;
    }
  }
  return "";
};

export const Preview = (props: PreviewProps) => {
  const { url, onLoad, text } = props;

  useEffect(() => {
    setTimeout(() => {
      // 超过1.5s停止loading，使用页面自带的loading
      onLoad();
    }, 1500);
  }, []);

  const query = getHeaderQuery(url);
  let Urr = text.match(
    /(https:\/\/([a-zA-Z0-9]|[一-龟]|-)+(\.([a-zA-Z0-9]|[一-龟]|-)+)+)(\/([a-zA-Z0-9]|[一-龟]|-)+)+\.[a-zA-Z0-9]{2,5}/g
  );
  if (Urr === null || Urr.length === 0) {
    if (url !== "" && url.length > 0) {
      return (
        <div>
          <iframe
            src={`${url}${query || ""}`}
            className="iframe-preview"
            onLoad={onLoad}
          ></iframe>
        </div>
      );
    } else if (text !== "" && text.length > 0) {
      return (
        <div>
          <p>{`${text}`}</p>
        </div>
      );
    } else {
      return (
        <div>
          <iframe
            src={`${url}${query || ""}`}
            className="iframe-preview"
            onLoad={onLoad}
          ></iframe>
        </div>
      );
    }
  } else if (Urr.length > 0) {
    var result = [];
    for (var inx in Urr) {
      let item = Urr[inx];
      let imgpage = (
        <div>
          <img className="iframe-img" src={`${item}`} onLoad={onLoad}></img>
        </div>
      );
      result.push(imgpage);
    }
    return result;
  }
  // if (query === null) {
  //   loadCallback();
  //   return null;
  // }
  // 下面一行是原来的return ，放在div里面的，现在替换成了img。原来是加载网页使用的
  /* return (
    <div>
      <iframe  src={`${url}${query || ""}`}  className="iframe-preview"    onLoad={onLoad}></iframe>
    </div>
  );*/
};
