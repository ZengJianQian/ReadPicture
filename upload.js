var tsFileUpload = function (
  adminPath,
  controlId,
  acceptFileTypes,
  maxFileSize,
  fileType,
  maxFileNum,
  readonly,
  isQrcode,
  isCamera,
  isScanner,
  faceUpload,
  faceDel
) {
  String.prototype.endWith = function (endStr) {
    var d = this.length - endStr.length;
    return d >= 0 && this.lastIndexOf(endStr) == d;
  };
  var fileUpload = new Object();
  $("#" + controlId + "ChooseFile").on("click", function () {
    $("#" + controlId + "File").click();
  });

  var expiredHtml =
    '<div id="' +
    controlId +
    'Refresh" onclick="' +
    controlId +
    'FileUpload.refreshQrCode()" style="position: absolute; top: 143px; left: 46px; background-color: #FFF; width: 150px; height: 150px; cursor: pointer;text-align: center;vertical-align: middle;line-height: 25px;padding: 20px;"><i class="fa fa-refresh text-green" style="vertical-align: middle;font-size: 40px;"></i><p class="text-gray">二维码已过期<br>点击刷新</p></div>';

  var sourceId = $("#" + controlId).val();
  if (sourceId && sourceId != "") {
    $.ajax({
      type: "post",
      url: "/control/file/listAjax",
      data: "sourceId=" + sourceId,
      dataType: "json",
      success: function (dataList) {
        if (dataList != null && dataList.length > 0) {
          for (var i = 0; i < dataList.length; i++) {
            $("#" + controlId + "UploadTable tbody").append(
              getFileUploadHtml(
                2,
                dataList[i].originalFileName,
                controlId,
                i + 1,
                dataList[i].id,
                dataList[i].fileSize
              )
            );
          }
          fileLoadIndex = dataList.length + 1;
          fileIndex = dataList.length + 1;
        }
      },
    });
  } else {
    sourceId = ts.guid();
  }

  var sock = null;
  var stomp = null;
  function socketConnect(userId) {
    sock = new SockJS("/endpointChat");
    stomp = Stomp.over(sock);
    stomp.debug = false;
    stomp.connect(
      undefined,
      undefined,
      function (frame) {
        stomp.subscribe("/topic/" + userId + "/message", function (response) {
          var data = JSON.parse(response.body);
          if (data.expired && data.expired == true) {
            imgSrc = "";
            $("#" + controlId + "qrcode_div")
              .find(".box-body")
              .append(expiredHtml);
            $(".layui-layer-content").find(".box-body").append(expiredHtml);
          }

          if (data.flag && data.flag == true && data.sourceId) {
            $("#" + controlId).val(data.sourceId);
            $("#" + controlId + "UploadTable tbody").html("");
            fileUpload.addUploadFile(data.sourceId);
          }
        });
      },
      function (error) {
        console.error(error);
      }
    );
  }

  $(window).on("unload", function () {
    if (stomp) {
      socketDisconnect();
    }
  });

  function socketDisconnect() {
    stomp.disconnect(function () {
      console.log("断开连接");
    });
  }

  var guid = ts.guid();
  maxFileNum = maxFileNum - $("#" + controlId + "UploadTable tbody tr").length;
  var imgSrc =
    "/sys/tag/qrcode?sourceId=" +
    sourceId +
    "&guid=" +
    guid +
    "&maxFileNum=" +
    maxFileNum +
    "&maxFileSize=" +
    maxFileSize +
    "&allowTypes=" +
    acceptFileTypes;
  var qrcodeHtml =
    '<div  id="' +
    controlId +
    'qrcode_div" class="hide"><div class="box box-primary box-solid no-margin" style="position: relative;">' +
    '<div class="box-header">' +
    '<i class="fa fa-qrcode"></i>' +
    '<h4 class="box-title">扫码上传</h4>' +
    "</div>" +
    '<div class="box-body text-center">' +
    '<h4 class="text-black">扫描二维码上传</h4>' +
    '<p class="link-black">请使用手机扫描二维码进行文件上传</p>' +
    '<img class="qrCode-image" width="200" src="' +
    imgSrc +
    '" alt="">' +
    "</div>" +
    "</div></div>";

  if (isQrcode) {
    if (typeof SockJS === "undefined") {
      throw new Error("扫码上传需要 SockJS");
    }
    if (typeof Stomp === "undefined") {
      throw new Error("扫码上传需要 Stomp");
    }

    $("#" + controlId + "QrCode").after(qrcodeHtml);

    socketConnect(guid);

    $("#" + controlId + "QrCode").on("click", function () {
      layer.open({
        type: 1,
        time: 0,
        title: false,
        closeBtn: false,
        shadeClose: true,
        shade: 0.01,
        //tips:[2, '#fff'],
        skin: "layui-layer-rim", //加上边框
        content: $("#" + controlId + "qrcode_div").html(),
      });
    });
  }

  var camera_div =
    '<div  id="' +
    controlId +
    'camera_div" style="display: none;">' +
    '<video id="video' +
    controlId +
    '" width="850px" style="padding-right: 11px;display: none;" height="600" controls></video>' +
    '<canvas id="canvas' +
    controlId +
    '" width="850px" height="550" style="display: none;"></canvas>' +
    '<input id="confirm' +
    controlId +
    '" style="margin-left: 80px;width: 300px;height: 50px;font-size: 24px;background-color: #f7c44e;border: 1px solid #f7c44e;color:white;" class="btn cameraBut" type="button" value="确认">' +
    '<input id="remake' +
    controlId +
    '" style="margin-left: 83px;width: 300px;height: 50px;font-size: 24px;background-color: #f7c44e;border: 1px solid #f7c44e;color:white;" class="btn cameraBut" type="button" value="重拍">' +
    "</div>";
  if (isCamera) {
    var isTrue = false,
      layerCamera,
      mediaStreamTrack,
      timing1,
      timing2,
      timing3,
      timing4;
    $("#" + controlId + "Camera").after(camera_div);
    var video = document.getElementById("video" + controlId);
    var canvas = document.getElementById("canvas" + controlId);
    var context = canvas.getContext("2d");
    $("#" + controlId + "Camera").on("click", function () {
      if (maxFileNum != 0) {
        var length = $("#" + controlId + "UploadTable tbody tr").length;
        if (length >= maxFileNum) {
          window.top.layer.alert("上传文件数量过多", { icon: 7 });
          return false;
        }
      }
      openCamera();
      if (
        navigator &&
        ((navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia)
      ) {
        layerCamera = window.top.layer.open({
          type: 1,
          time: 0,
          title: false,
          closeBtn: 1,
          shadeClose: false,
          area: ["850px", "620px"],
          shade: 0.01,
          //tips:[2, '#fff'],
          skin: "layui-layer-rim", //加上边框
          content: $("#" + controlId + "camera_div"),
          end: function () {
            clearTimeout(timing1);
            clearTimeout(timing2);
            clearTimeout(timing3);
            clearTimeout(timing4);
            mediaStreamTrack.getTracks().forEach(function (track) {
              track.stop();
            });
          },
        });
      }
    });

    $("#confirm" + controlId).on("click", function () {
      if (!isTrue) return false;
      isTrue = false;
      $.ajax({
        async: false,
        type: "post",
        url: "/control/file/uploadBase64", //请求发送的目标地址
        data: {
          sourceId: sourceId,
          fileBase64: canvas.toDataURL(),
        },
        dataType: "json",
        success: function (data) {
          //console.log(data);
          if (data.flag) {
            fileIndex = fileLoadIndex = $("#" + controlId + "UploadTable").find(
              "tr"
            ).length;
            $("#" + controlId + "UploadTable tbody").append(
              getFileUploadHtml(1, data.name, controlId, fileLoadIndex, null, 0)
            );
            $("#" + controlId + "progress" + fileIndex).html("100%");
            $("#" + controlId + "progress" + fileIndex).hide();
            $(
              "#" +
                controlId +
                "progreprogressBarssBar" +
                fileIndex +
                " .progress-bar"
            ).css("width", "100%");
            $("#" + controlId + "progressBar" + fileIndex).hide();
            $("#" + controlId + "FileSize" + fileIndex).html(
              getFileSizeText(data.fileSize)
            );
            $("#" + controlId + "FileSize" + fileIndex).show();
            var fileNameTd = $(
              "#" + controlId + "FileUploadTr" + fileIndex
            ).find("td[name='fileName']");
            var fileName = $("#" + controlId + "FileUploadTr" + fileIndex)
              .find("td[name='fileName']")
              .text();
            var type = "image";
            var imgSrc = "/control/file/down?id=" + data.id;
            var previewTd = $(
              "#" + controlId + "FileUploadTr" + fileIndex
            ).find("td[name='preview']");
            $(previewTd).html(
              "<image src='" +
                imgSrc +
                "' style='width:22px;height:22px;cursor: pointer;' onclick='" +
                controlId +
                'FileUpload.preview("' +
                data.id +
                '","' +
                type +
                "\")'/>"
            );
            var fileNameTd = $(
              "#" + controlId + "FileUploadTr" + fileIndex
            ).find("td[name='fileName']");
            $(fileNameTd).html(
              '<a href="javascript:;" onclick="javascript:' +
                controlId +
                "FileUpload.downFile('/control/file/down?id=" +
                data.id +
                "')\">" +
                data.name +
                "</a>"
            );
            $("#" + controlId).val(data.sourceId);
            $("#" + controlId + "Attid" + fileIndex).val(data.id);
            fileLoadIndex++;
            window.top.layer.msg(data.message, { time: 2500 });
          } else {
            window.top.layer.alert(data.message, { icon: 7 });
          }
        },
      });
      window.top.layer.close(layerCamera);
      mediaStreamTrack.getTracks().forEach(function (track) {
        track.stop();
      });
    });
    $("#remake" + controlId).on("click", function () {
      openCamera();
    });
    function openCamera() {
      $("#canvas" + controlId).hide();
      $("#confirm" + controlId).hide();
      $("#remake" + controlId).hide();
      //$("#"+controlId+"camera_div").show();
      if (
        navigator &&
        ((navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia)
      ) {
        //调用用户媒体设备, 访问摄像头
        $("#video" + controlId).show();
        getUserMedia({ video: { width: 850, height: 550 } }, success, error);
      } else {
        window.top.layer.alert("不支持访问的用户媒体", { icon: 7 });
      }
    }
    function operation() {
      $("#video" + controlId).show();
      $("#canvas" + controlId).hide();
      timing1 = setTimeout(function () {
        window.top.layer.msg("3秒后将自动拍照", { time: 1000 });
      }, 1000);
      timing2 = setTimeout(function () {
        window.top.layer.msg("2秒后将自动拍照", { time: 1000 });
      }, 2000);
      timing3 = setTimeout(function () {
        window.top.layer.msg("1秒后将自动拍照", { time: 1000 });
      }, 3000);
      timing4 = setTimeout(function () {
        isTrue = true;
        context.drawImage(video, 0, 0, 850, 550);
        $("#video" + controlId).hide();
        $("#canvas" + controlId).show();
        $("#confirm" + controlId)
          .show()
          .attr("disabled", false);
        $("#remake" + controlId)
          .show()
          .attr("disabled", false);
        mediaStreamTrack.getTracks().forEach(function (track) {
          track.stop();
        });
      }, 4000);
    }
    //访问用户媒体设备的兼容方法
    function getUserMedia(constraints, success, error) {
      if (navigator.mediaDevices.getUserMedia) {
        //最新的标准API
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(success)
          .catch(error);
      } else if (navigator.webkitGetUserMedia) {
        //webkit核心浏览器
        navigator.webkitGetUserMedia(constraints, success, error);
      } else if (navigator.mozGetUserMedia) {
        //firfox浏览器
        navigator.mozGetUserMedia(constraints, success, error);
      } else if (navigator.getUserMedia) {
        //旧版API
        navigator.getUserMedia(constraints, success, error);
      }
    }
    function success(stream) {
      //兼容webkit核心浏览器
      //var CompatibleURL = window.URL || window.webkitURL;
      //将视频流设置为video元素的源
      //console.log(stream);
      //video.src = CompatibleURL.createObjectURL(stream);
      mediaStreamTrack = video.srcObject = stream;
      video.src = stream;
      video.play();
      operation();
    }
    function error(error) {
      console.log(error);
      layer.confirm(
        "访问用户媒体设备失败",
        { title: "提示", btn: ["确定"] },
        function (i) {
          layer.close(i);
          window.top.layer.close(layerCamera);
        }
      );
      console.log("访问用户媒体设备失败${error.name}, ${error.message}");
    }
  }

  if (isScanner) {
    $("#" + controlId + "ChooseFile").hide();
    $("#" + controlId + "Scanner").on("click", function () {
      $("#" + controlId + "ChooseFile").show();
      window.location.href = "Scanner://open";
    });
  }

  $("#" + controlId + "File")
    .fileupload({
      url: "/control/file/upload?sourceId=" + sourceId, //请求发送的目标地址
      Type: "POST", //请求方式 ，可以选择POST，PUT或者PATCH,默认POST
      //iframe: iframe,
      dataType: "json", //服务器返回的数据类型
      formData: {},
      autoUpload: true,
      maxNumberOfFiles: 100, //最大上传文件数目
      //sequentialUploads: true,
      pasteZone: null,
      dropZone: $("#" + controlId + "UploadTable")
        .parent()
        .parent()
        .parent()
        .parent()
        .parent(),
    })
    //添加完成后触发的事件
    .on("fileuploadadd", function (e, data) {
      if (maxFileNum != 0) {
        var length = $("#" + controlId + "UploadTable tbody tr").length;
        if (length >= maxFileNum) {
          window.top.layer.alert("上传文件数量过多", { icon: 7 });
          return false;
        }
      }
      if (fileUpload.validate(data.files[0])) {
        fileIndex = fileLoadIndex = $("#" + controlId + "UploadTable").find(
          "tr"
        ).length;
        //console.log("ssssssssssss>:",fileIndex);
        $("#" + controlId + "UploadTable tbody").append(
          getFileUploadHtml(
            1,
            data.files[0].name,
            controlId,
            fileLoadIndex,
            null,
            0
          )
        );
        $("#" + controlId + "UploadTable tbody")
          .find("tr:last")
          .addClass("starting");
        jqXHR = data.submit();
        fileLoadIndex++;
      } else {
        //不通过则不上传
        return false;
      }
      $("[type='submit']").prop("disabled", true).addClass("disabled");
    })
    //当一个单独的文件处理队列结束触发(验证文件格式和大小)
    .on("fileuploadprocessalways", function (e, data) {
      $("[type='submit']").prop("disabled", false).removeClass("disabled");
      //获取文件
      file = data.files[0];
      //获取错误信息
      if (file.error) {
        alert(file.error);
        return false;
      }
    })
    //显示上传进度条
    .on("fileuploadprogressall", function (e, data) {
      $("[type='submit']").addClass("disabled");
      var progress = parseInt((data.loaded / data.total) * 100, 10);
      $("#" + controlId + "progress" + fileIndex).html(progress + "%");
      $("#" + controlId + "progressBar" + fileIndex + " .progress-bar").css(
        "width",
        progress + "%"
      );
    })
    //上传请求失败时触发的回调函数
    .on("fileuploadfail", function (e, data) {
      console.log(data.errorThrown);
    })
    //上传请求成功时触发的回调函数
    .on("fileuploaddone", function (e, data) {
      if (data && !data.result.flag) {
        window.top.layer.alert(data.result.message, { icon: 7 });
        $("#fjidFileUploadTr" + fileIndex).remove();
        return;
      }
      //console.log($(".starting").length);
      var x = $(".starting:eq(0)");
      $(x).find(".badge").html("100%").hide();
      $(x).find(".progress").css("width", "100%").hide();
      // $(x).find("td:eq(3) div:eq(1)").html(getFileSizeText(data.result.fileSize)).show();
      $(x)
        .find(".progress")
        .next()
        .html(getFileSizeText(data.result.fileSize))
        .show();
      if (fileType == "image") {
        var fileName = $(x).find("td[name='fileName']").text();
        //console.log(fileType,fileName);
        var type = "image";
        var imgSrc = "/control/file/down?id=" + data.result.id;
        if (fileName.endWith("pdf") || fileName.endWith("PDF")) {
          (type = "pdf"), (imgSrc = "/static/image/common/pdf.png");
        }
        $(x)
          .find("td[name='preview']")
          .html(
            "<image src='" +
              imgSrc +
              "' style='width:22px;height:22px;cursor: pointer;' onclick='" +
              controlId +
              'FileUpload.preview("' +
              data.result.id +
              '","' +
              type +
              "\")'/>"
          );
      } else if (fileType == "media") {
        $(x)
          .find("td[name='preview']")
          .html(
            "<i class=\"fa fa-fw fa-play-circle\" style='width:22px;height:22px;cursor: pointer;' onclick='" +
              controlId +
              'FileUpload.preview("' +
              data.result.id +
              '","' +
              fileType +
              "\")'></i>"
          );
      }
      var fileNameTd = $("#" + controlId + "FileUploadTr" + fileIndex).find(
        "td[name='fileName']"
      );
      $(x)
        .find("td[name='fileName']")
        .html(
          '<a href="javascript:;" onclick="javascript:' +
            controlId +
            "FileUpload.downFile('/control/file/down?id=" +
            data.result.id +
            "')\">" +
            data.files[0].name +
            "</a>"
        );
      $("#" + controlId).val(data.result.sourceId);
      /*if(faceUpload){//人脸改为统一认证后注释
            setTimeout(""+$("#"+controlId+"faceUpload").attr("onclikc"),1)
        }*/
      $(x).find("input:eq(0)").val(data.result.id);
      $(x).removeClass("starting");
    })
    //上传请求结束后，不管成功，错误或者中止都会被触发
    .on("fileuploadalways", function (e, data) {
      $("[type='submit']").prop("disabled", false).removeClass("disabled");
      fileIndex++;
      //重置序号
      $("#" + controlId + "UploadTable tbody tr").each(function (i, ele) {
        $(ele)
          .find("td:eq(0)")
          .html(i + 1);
      });
    });
  fileUpload.validate = function (file) {
    if (maxFileNum != 0) {
      var length = $("#" + controlId + "UploadTable tbody tr").length;
      if (length >= maxFileNum) {
        window.top.layer.alert("上传文件数量过多", { icon: 7 });
        return false;
      }
    }
    if (file.size <= 0) {
      window.top.layer.alert("'" + file.name + "'文件大小为0，无法上传", {
        icon: 7,
      });
      return false;
    }
    //获取文件名称
    var fileName = file.name;
    var pattern = new RegExp(
      "[%`~!@#$^&*()=|{}':;',\\[\\]<>/?~！@#￥……&*——|{}【】‘；：”“'。，、？]"
    ); //格式 RegExp("[在中间定义特殊过滤字符]")

    if (pattern.test(fileName)) {
      window.top.layer.alert("文件名不允许包含特殊字符", { icon: 7 });
      return false;
    }
    // fileName=htmlspecialchars(fileName);
    //验证文件格式
    if (acceptFileTypes != null && acceptFileTypes != "") {
      var check = false;
      if (acceptFileTypes == "*") {
        check = true;
      } else {
        var regs = "/(";
        var afts = acceptFileTypes.split(",");
        for (var i = 0; i < afts.length; i++) {
          if (afts[i] != "") {
            if (i != 0) {
              regs += "|";
            }
            regs += afts[i];
          }
        }
        regs += ")$/";
        if (eval(regs).test(fileName.toLowerCase())) {
          check = true;
        }
      }
      if (!check) {
        window.top.layer.alert("文件类型不匹配", { icon: 7 });
        return false;
      }
    }
    var fileSize = file.size;
    if (maxFileSize && maxFileSize != 0 && fileSize > maxFileSize) {
      window.top.layer.alert("文件过大", { icon: 7 });
      return false;
    }
    return true;
  };
  fileUpload.del = function (index) {
    var layerIndex = window.top.layer.confirm(
      "确认删除附件？",
      { icon: 3, title: "提示" },
      function () {
        if (jqXHR) {
          jqXHR.abort();
        }

        var attId = $("#" + controlId + "Attid" + index).val();
        $("#" + controlId + "FileUploadTr" + index).remove();
        //重置序号
        $("#" + controlId + "UploadTable tbody tr").each(function (i, ele) {
          $(ele)
            .find("td:eq(0)")
            .html(i + 1);
        });
        if (faceDel) {
          setTimeout("" + $("#" + controlId + "faceDel").attr("onclikc"), 1);
        }
        if (attId != null && attId != "") {
          $.ajax({
            type: "post",
            url: "/control/file/delete",
            data: "id=" + attId,
            dataType: "json",
            success: function (data) {
              if (data) {
                if ($("input[id*='" + controlId + "Attid']").length <= 0) {
                  $("#" + controlId).val("");
                }
              }
            },
          });
        }
        window.top.layer.close(layerIndex);
      }
    );
  };
  fileUpload.remove = function (id, index) {
    //删除附件
    if (!!id) {
      $("#" + controlId + "FileUploadTr" + index).remove();
      $.ajax({
        type: "post",
        url: "/control/file/delete",
        data: "id=" + id,
        dataType: "json",
        success: function (data) {
          if (data) {
            if ($("input[id*='" + controlId + "Attid']").length <= 0) {
              $("#" + controlId).val("");
            }
          }
        },
      });
    }
  };
  fileUpload.downFile = function (url, id) {
    var fun = $("#" + controlId).attr("clickFile");
    if (fun) {
      try {
        eval(fun + "('" + url + "','" + id + "')");
      } catch (error) {}
    } else {
      window.open(url);
    }
  };

  fileUpload.downImage = function (index) {
    parent.ts.layer.open({
      type: 2,
      title: "附件",
      content: "/control/file/lunbo?sourceId=" + sourceId + "&index=" + index,
      area: ["1360px", "620px"],
    });
  };

  fileUpload.preview = function (id, type) {
    if (type == "pdf") {
      var url = encodeURIComponent("/control/file/down?id=" + id);
      window.top.layer.open({
        type: 2,
        title: "查看图片",
        shadeClose: true,
        area: ["80%", "80%"],
        content: "/control/file/pdfViewer?url=" + url,
      });
      // window.top.layer.alert('PDF暂不支持预览,请点击附件名称下载。', {icon: 2})
    } else if (type == "image") {
      window.top.layer.open({
        type: 1,
        title: "查看图片",
        shadeClose: true,
        area: ["80%", "80%"],
        content: '<img src="/control/file/down?id=' + id + '"/>',
        success: function (layero, index) {
          $(layero)
            .find(".layui-layer-content")
            .css({ "overflow-x": "auto", "text-align": "center" });
          $(layero)
            .find(".layui-layer-content")
            .find("img")
            .css({ "max-width": "100%", "max-height": "100%" });
        },
      });
    } else if (type == "media") {
      window.top.layer.open({
        type: 1,
        title: "查看视频",
        shadeClose: true,
        area: ["80%", "80%"],
        content:
          '<video controls="controls" style="height:100%;width:100%;"><source src="/control/file/down?id=' +
          id +
          '" type="video/mp4"/>您的浏览器不支持视频播放。</video>',
      });
    }
  };
  fileUpload.example = function (url, type) {
    if (url.endWith("pdf") || url.endWith("PDF")) {
      window.top.layer.open({
        type: 2,
        title: "查看图片",
        shadeClose: true,
        area: ["80%", "80%"],
        content: "/control/file/pdfViewer?url=" + url,
      });
      return;
    }
    if (type == "image") {
      window.top.layer.open({
        type: 1,
        title: "查看图片",
        shadeClose: true,
        area: ["80%", "80%"],
        content: '<img src="' + url + '"/>',
        success: function (layero, index) {
          $(layero)
            .find(".layui-layer-content")
            .css({ "overflow-x": "auto", "text-align": "center" });
        },
      });
    } else if (type == "media") {
      window.top.layer.open({
        type: 1,
        title: "查看视频",
        shadeClose: true,
        area: ["80%", "80%"],
        content:
          '<video controls="controls" style="height:100%;width:100%;"><source src="' +
          url +
          '" type="video/mp4"/>您的浏览器不支持视频播放。</video>',
      });
    } else {
      window.open(url);
      return false;
    }
  };
  fileUpload.getFileLength = function () {
    return $("#" + controlId + "UploadTable tbody tr").length;
  };
  fileUpload.addUploadFile = function (sourceId) {
    $.ajax({
      type: "post",
      url: "/control/file/listAjax",
      data: { sourceId: sourceId },
      dataType: "json",
      success: function (dataList) {
        if (dataList != null && dataList.length > 0) {
          for (var i = 0; i < dataList.length; i++) {
            $("#" + controlId + "UploadTable tbody").append(
              getFileUploadHtml(
                2,
                dataList[i].originalFileName,
                controlId,
                i + 1,
                dataList[i].id,
                dataList[i].fileSize
              )
            );
            //console.log(dataList[i].id);
          }
          fileLoadIndex = dataList.length + 1;
          fileIndex = dataList.length + 1;
        }
      },
    });
  };
  fileUpload.refreshQrCode = function () {
    socketDisconnect();
    guid = ts.guid();
    maxFileNum =
      maxFileNum - $("#" + controlId + "UploadTable tbody tr").length;
    var imgSrc =
      "/sys/tag/qrcode?sourceId=" +
      sourceId +
      "&guid=" +
      guid +
      "&maxFileNum=" +
      maxFileNum +
      "&maxFileSize=" +
      maxFileSize +
      "&allowTypes=" +
      acceptFileTypes;
    $("#" + controlId + "qrcode_div")
      .find(".qrCode-image")
      .attr("src", imgSrc);
    $(".layui-layer-content").find(".qrCode-image").attr("src", imgSrc);
    $("#" + controlId + "qrcode_div")
      .find("#" + controlId + "Refresh")
      .remove();
    $(".layui-layer-content")
      .find("#" + controlId + "Refresh")
      .remove();
    socketConnect(guid);
  };

  fileLoadIndex = 1;
  fileIndex = 1;
  jqXHR = null;
  function getFileUploadHtml(
    type,
    fileName,
    controlId,
    fileLoadIndex,
    attId,
    fileSize
  ) {
    var pattern = new RegExp(
      "[%`~!@#$^&*()=|{}':;',\\[\\]<>/?~！@#￥……&*——|{}【】‘；：”“'。，、？]"
    ); //格式 RegExp("[在中间定义特殊过滤字符]")
    var rs = "";
    for (var i = 0; i < fileName.length; i++) {
      rs = rs + fileName.substr(i, 1).replace(pattern, "");
    }
    fileName = rs;
    //console.log(type,fileName,fileLoadIndex);
    var html = "<tr id='" + controlId + "FileUploadTr" + fileLoadIndex + "'>";
    html += "	<td class='text-center'>" + fileLoadIndex + "</td>";
    if (fileType == "image") {
      if (type == 1) {
        html += "	<td class='text-center' name='preview'></td>";
      } else {
        var imgSrc = "/control/file/down?id=" + attId;
        if (fileName.endWith(".pdf") || fileName.endWith(".PDF")) {
          type = "pdf";
          imgSrc = "/static/image/common/pdf.png";
          fileName =
            '<a href="javascript:;" onclick="javascript:' +
            controlId +
            "FileUpload.downFile('/control/file/down?id=" +
            attId +
            "','" +
            attId +
            "')\">" +
            fileName +
            "</a>";
          html +=
            "	<td class='text-center' name='preview'><image src='" +
            imgSrc +
            "' style='width:22px;height:22px;cursor: pointer;' onclick='" +
            controlId +
            'FileUpload.preview("' +
            attId +
            '","' +
            type +
            "\")'/></td>";
        } else if (
          fileName.endWith(".tif") ||
          fileName.endWith(".tiff") ||
          fileName.endWith(".TIF") ||
          fileName.endWith(".TIFF")
        ) {
          fileName =
            '<a href="javascript:;" onclick="javascript:' +
            controlId +
            "FileUpload.downFile('/control/file/down?id=" +
            attId +
            "','" +
            attId +
            "')\">" +
            fileName +
            "</a>";
          html +=
            "	<td class='text-center' name='preview'><image src='" +
            imgSrc +
            "' style='width:22px;height:22px;cursor: pointer;' onclick=\"javascript:" +
            controlId +
            "FileUpload.downImage(" +
            fileLoadIndex +
            ')"/></td>';
        } else {
          fileName =
            '<a href="javascript:;" onclick="javascript:' +
            controlId +
            "FileUpload.downImage(" +
            fileLoadIndex +
            ')">' +
            fileName +
            "</a>";
          html +=
            "	<td class='text-center' name='preview'><image src='" +
            imgSrc +
            "' style='width:22px;height:22px;cursor: pointer;' onclick=\"javascript:" +
            controlId +
            "FileUpload.downImage(" +
            fileLoadIndex +
            ')"/></td>';
        }
      }
    } else if (fileType == "media") {
      if (type == 1) {
        html += "	<td class='text-center' name='preview'></td>";
      } else {
        fileName =
          '<a href="javascript:;" onclick="javascript:' +
          controlId +
          "FileUpload.downFile('/control/file/down?id=" +
          attId +
          "','" +
          attId +
          "')\">" +
          fileName +
          "</a>";
        html +=
          "	<td class='text-center' name='preview'><i class=\"fa fa-fw fa-play-circle\" style='width:22px;height:22px;cursor: pointer;' onclick='" +
          controlId +
          'FileUpload.preview("' +
          attId +
          '","' +
          fileType +
          "\")'></i></td>";
      }
    } else {
      if (type == 2) {
        fileName =
          '<a href="javascript:;" onclick="javascript:' +
          controlId +
          "FileUpload.downFile('/control/file/down?id=" +
          attId +
          "','" +
          attId +
          "')\">" +
          fileName +
          "</a>";
      }
    }
    html += "	<td name='fileName'>" + fileName + "</td>";
    html += "	<td>";
    if (type == 1) {
      html +=
        "		<div id='" +
        controlId +
        "progressBar" +
        fileLoadIndex +
        "' class='progress progress-xs progress-striped active'>";
      html +=
        "			<div class='progress-bar progress-bar-primary' style='width: 0%'></div>";
      html += "		</div>";
      html +=
        "		<div id='" +
        controlId +
        "FileSize" +
        fileLoadIndex +
        "' style='display:hidden;'></div>";
    } else {
      html +=
        "		<div id='" +
        controlId +
        "FileSize" +
        fileLoadIndex +
        "'>" +
        getFileSizeText(fileSize) +
        "</div>";
    }
    html += "	</td>";
    if (readonly != "true") {
      html += "	<td class='text-center'>";
      if (type == 1) {
        html +=
          "	<span class='badge bg-light-blue' id='" +
          controlId +
          "progress" +
          fileLoadIndex +
          "'>0%</span>";
      }
      html +=
        "	&nbsp;&nbsp;<button class='btn btn-danger btn-xs' type='button' onclick='" +
        controlId +
        "FileUpload.del(" +
        fileLoadIndex +
        ")'><i class='fa fa-remove'></i></button>";
      html +=
        "	<input type='hidden' id='" +
        controlId +
        "Attid" +
        fileLoadIndex +
        "' value='" +
        attId +
        "'/>";
      html += "	</td>";
    }
    html += "</tr>";
    return html;
  }
  function getFileSizeText(fileSize) {
    if (fileSize === 0) return "0 B";
    var k = 1024, // or 1000
      sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
      i = Math.floor(Math.log(fileSize) / Math.log(k));
    return (fileSize / Math.pow(k, i)).toFixed(3) + " " + sizes[i];
  }

  return fileUpload;
};
