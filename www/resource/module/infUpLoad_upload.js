/**
 * Created by ruby on 2014/12/27.
 */
define(function (require, exports) {
  var base = require('y_base');
  var files = [];
  var count = 0;
  exports.init = function () {
    var uploader = new plupload.Uploader({
      // General settings
      runtimes: 'html5,flash,silverlight,html4',
      browse_button: 'pickFiles', // you can pass in id...
      url: '/Post/P/receiveFiles',
      chunk_size: '1mb',
      filters: {
        max_file_size: '10mb',
        mime_types: [
          {title: 'json files', extensions: 'json'}
        ]
      },
      flash_swf_url: '../js/Moxie.swf',
      silverlight_xap_url: '../js/Moxie.xap',

      // PreInit events, bound before the internal events
      preinit: {
        Init: function (up, info) {
          $('#uploadFiles').on('click', function () {
            uploader.start();
            return false;
          })
        }
      },
      // Post init events, bound after the internal events
      init: {
        PostInit: function () {
          // Called after initialization is finished and internal event handlers bound
          $('#uploadfiles').on('click', function () {
            count = 0;
            uploader.start();
            return false;
          })
        },
        Browse: function (up) {
          if (up.total.uploaded) {
            if(lastUpload){
              var p=confirm('当前文件已上传结束，清除上传列表？');
              if(p){
                location=location;
              }
            }else{
              alert('当前有文件已上传，但并未存储至数据库，请先提交！');
            }
            return false;
          }
        },
        UploadProgress: function (up, file) {
          // Called while file is being uploaded
          $('#' + file.id + ' td:eq(1)').html('上传进度:' + file.percent + '%');
        },
        FilesAdded: function (up, files) {
          // Called when files are added to queue
          if ($('#fileList').is(':hidden')) {
            $('#fileList').show();
          }
          plupload.each(files, function (file) {
            $('#fileList table').append('<tr id="' + file.id + '"><td>' + file.name + ' (' + plupload.formatSize(file.size) + ') </td><td></td></tr>');
          });
        },

        FileUploaded: function (up, file, info) {
          // Called when file has finished uploading
          var response = JSON.parse(info.response),
            steps = $('#' + file.id + '>.steps');
          var ws = new WebSocket("ws://" + location.hostname + ':8360/websocket/W/open');
          ws.onopen = function () {
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              method: "/websocket/W/open",
              params: {tempPath: response.tempPath, originalFilename: response.originalFilename, fileId: file.id}
            }))
          };
          ws.onmessage = function (evt) {
            var received = JSON.parse(evt.data);
            if (received.result.status) {
              $('#' + file.id).append('<td>&radic;</td>');
              var pathInfo = received.result.pathInfo;
              if (typeof  pathInfo != 'undefined') {
                count++;
                //每次文件在后台暂存成功都会返回一个pathInfo，记录接口地址、暂存地址
                for (var i in pathInfo) {
                  var infInfo = {
                    infAdd: i,
                    filePath: pathInfo[i]
                  };
                }
                infInfo.fileId = file.id;
                files.push(infInfo);
                if (up.files.length == count) {
                  $('#submit').removeClass('disabled');
                  window.files = files;
                }
              }
            } else {
              $('#' + file.id).append('<td>&chi;</td>');
              $('#fileList .note').show();
            }
          };
        },
        Error: function (up, args) {
          // Called when error occurs
          $('#fileList .note').show();
          $('#submit').addClass('disabled');
        }
      }
    });
    uploader.init();
  }
})