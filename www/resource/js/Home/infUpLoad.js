/**
 * Created by SYSTEM on 2014/12/21.
 */
$(function(){
  seajs.use(['infUpLoad_upload','infUpLoad_submit'],function(upload,submit){
    upload.init();
    submit.init();
  });

})
