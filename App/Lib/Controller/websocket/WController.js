/**
 * Created by ruby on 2014/11/23.
 */
module.exports = Controller('websocket/BaseController',function(){
  'use strict';
  var allPath={};
  return {
    openAction: function(){
      /*
      * 检验json文件并做出所有转换
      * 当json文件上传时，转换并记录路径，将相关信息通过path参数（接口全地址：服务器文件存储地址）传到客户端。
      * 如果上传或转换出错，删除之前的上传文件及其转换文件
      * */
      if(C_isEmpty(this.get())) return;
      var tempPath=this.get('tempPath');
      var originalFilename=this.get('originalFilename');
      var fileId=this.get('fileId');
      var infAdd=mockPlus.getInfAdd(tempPath);
      var websocket=this.http.websocket;
      var savePath=C_createUniquePath(tempPath);
      var jsonPath=savePath.jsonPath,
        mockPath=savePath.mockPath,
        docPath=savePath.docPath,
        fileName=C_getFileName(originalFilename),
        pathInfo={};

      //对本此批量传输记录所有接口路径，以检测重复
      if(typeof allPath[infAdd]=='undefined'){
        websocket.send({
          status:true,
          msg:'接口地址无重复!'
        })
        allPath[infAdd]=savePath.basePath;
      }else{
        websocket.send({
          status:false,
          msg:'接口地址重复!'
        })
        websocket.end();
      }
      //记录本次路径，用于在文件处理成功后返回给客户端
      if(typeof pathInfo[infAdd]=='undefined'){
        pathInfo[infAdd]=savePath.basePath;
      }
      //文件处理
      if(!/\w\?*\/*\=*\&*/.test(infAdd)){
        websocket.send({
          status:false,
          msg:'您的接口文件没有指定接口路径！'
        })
        websocket.end();
      }else{
        websocket.send({
          status:true,
          msg:'接口路径检测通过！'
        })
      }
      promise_readFile(tempPath,'utf-8')
        .catch(function(err){
          websocket.send({
            status:false,
            msg:'读取暂存文件出错!'
          })
          websocket.end();
        })
        .then(function(data){
          websocket.send({
            status:true,
            msg:'读取暂存文件成功!'
          })
          return promise_writeFile(jsonPath+'/i.json',data)
        })
        .catch(function(err){
          websocket.send({
            status:false,
            msg:'写入文件出错!',
            detail:err
          })
          websocket.end();
        })
        .then(function(){
          websocket.send({
            status:true,
            msg:'写入文件出错!'
          })
          return promise_toMock(tempPath,mockPath+'/i.json')
        })
        .catch(function(err){
          websocket.send({
            status:false,
            msg:'mock数据生成失败!请检查您的接口文件!',
            detail:err
          });
          websocket.end();
        })
        .then(function(){
          websocket.send({
            status:true,
            msg:'mock数据生成成功!'
          });
          return promise_toHtml(tempPath,docPath+'/i.html');
        })
        .catch(function(err){
            console.log(err)
          websocket.send({
            status:false,
            msg:'html生成失败！请检查您的接口文件!',
            detail:err
          })
          websocket.end();
        })
        .then(function(){
          websocket.send({
            status:true,
            msg:'html已成功生成!',
            pathInfo:pathInfo,
            fileId:fileId
          });
          websocket.end();
        })



    }
  }
})