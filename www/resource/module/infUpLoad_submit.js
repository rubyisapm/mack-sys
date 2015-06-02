/**
 * Created by ruby on 2014/12/27.
 */
define(function(require,exports){
  var Validator=require('Validator').Validator;
  return {
    init:function(){
      lastUpload=false;
      $('#submit').on('click',function(){
        if($(this).hasClass('disabled')) return;
        /*
         * 信息验证
         * 1、域名不为空且符合规则
         * 2、端口可以为空
         * 3、文件至少一个且已上传成功,体现在这里就是files不为空
         * */
        var data={};
          data.domain=$.trim($('#domainAdd').val());
          data.port=$.trim($('#port').val());
          data.files=JSON.stringify(window.files);
          /*
           * files中的信息为:
           * {
           *   infAdd:'接口地址',
           *   filePath:'服务器暂存地址',
           *   fileId:上传队列中生成的每个文件的唯一ID
           * }
           * fileId需要传的唯一原因就是在后端存储数据库失败时要在前端做标识。因为文件已通过验证，数据库的出错概率较低，所以此时允许部分失败。
           * */
          var validator=new Validator({
            domain:{
              required:true,
              domain:true
            },
            port:{
              required:true,
              port:true
            },
            files:{
              defined:true,
              notEmptyArray:true
            }
          });
          validator.addValidation('domain',function(r){
            if(r){
              if(!(/^[a-zA-Z]{5,10}$/.test(this.value))){
                return {
                  status:false,
                  msg:'请输入正确的网站名称!'
                }
              }else{
                return {
                  status:true
                }
              }
            }
          })
          validator.addValidation('notEmptyArray',function(r){
            if(r){
              if(this.value.length<1){
                return {
                  status:false,
                  msg:'文件不存在!'
                }
              }else{
                return {
                  status:true
                }
              }
            }
          });
          validator.addValidation('defined',function(r){
            if(r){
              if(typeof this.value=='undefined'){
                return {
                  status:false,
                  msg:'文件不存在！'
                }
              }else{
                return {
                  status:true
                }
              }
            }
          });
          var toValidate={
            domain:{
              value:data.domain,
              note:$('#note_domainAdd')
            },
            port:{
              value:data.port,
              note:$('#note_port')
            },
            files:{
              value:window.files,
              note:$('#note_files')
            }
          }
          if(!validator.validate(toValidate).passed) return;
        $('.loading').show();
        Promise.resolve($.ajax({
          url:'/Post/P/save',
          type:'post',
          data:data,
          dataType:'json'
        })).then(function(data){
          if(data.errno){
            var detail=data.data;
            for(var i=0;i<detail.length;i++){
              if(!detail[i].errdata){
                $('#'+detail[i].fileId).append('<td>&radic;</td>');
              }else{
                $('#'+detail[i].fileId).append('<td>&chi;</td>').attr('title','错误代码:'+detail[i].errdata.errno);
              }
            }
            $('#note').html('<b class="message_error"></b>'+data.errmsg).show();
          }else{
            $('#fileList tbody tr').append('<td>&radic;</td>');
            $('#note').html('<b class="message_success"></b>'+data.msg).show();
          }
          /*改变整个页面的上传状态tag*/
          lastUpload=true;
          $('.loading').hide();
        }).catch(function(err){
          alert('请求出错');
          lastUpload=true;
        })
      })
    }
  }
})