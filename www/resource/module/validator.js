/**
 * Created by ruby on 2014/11/23.
 */
function Validator(rule){
  this.rule=rule;
}
Validator.prototype={
  constructor:Validator,
  validate:function(data){
    /*
    * 处理'required'规则和其他规则的关系
    * 原则：
    * 允许为空：值为空时，不进行下面的规则判定
    * 不允许为空：按照并列规则处理
    * */
    //invoke the test method
    var validations=this.validations;
    this.result=[];
    for(var i in data){
      var rule=this.rule[i];
      if(!rule.required && data[i].value=='') continue;
      for(var j in rule){
        var feedback=validations[j].call(data[i],rule[j]);
        if(!feedback.status){
          if(data[i].note){
            this.noteInit(data[i].note,feedback.msg,false);
          }
          this.result.push({data:i,msg:feedback.msg});
          break;
        }
        if(data[i].note){
          //如果被验证数据中含有提示信息位置设置
          this.noteInit(data[i].note,"验证通过！",true);
        }
      }
    }
    if(this.result.length<1){
      //全部验证通过
      return {
        passed:true
      };
    }else{
      return {
        passed:false,
        result:this.result
      };
    }

  },
  trim:function(v){
    return v.replace(/$\s+/,'').replace(/\s+$/,'');
  },
  noteInit:function(c,m,status){
    if(status){
      c.removeClass('wrong').addClass('right');
    }else{
      c.removeClass('right').addClass('wrong');
    }
    c.html(m);
  },
  validations:{
    required:function(r){
      if(r){
        if(this.value==""){
          return {
            status:false,
            msg:"该值不能为空！"
          }
        }else{
          return {
            status:true
          }
        }
      }

    },
    /*defined:function(r){
      if(r){
        if(typeof this.vlaue=='undefined'){
          return {
            status:false,
            msg:'该值不存在！'
          }
        }else{
          return {
            status:true
          }
        }
      }
    },
    notEmptyArray:function(r){
      if(r){
        if(this.value.length<1){
          return {
            status:true,
            msg:'该值不能为空!'
          }
        }
      }
    },*/
    zhOnly:function(r){
      if(r){
        if(!/^[^u4e00-u9fa5]+$/.test(this.value)){
          return {
            status:false,
            msg:"只能输入中文！"
          }
        }else{
          return {
            status:true
          }
        }
      }

    },
    enOnly:function(r){
      if(r){
        if(!/^[a-z]+&/.test(this.value)){
          return {
            status:false,
            msg:"只能输入英文！"
          }
        }else{
          return {
            status:true
          }
        }
      }
    },
    domain:function(r){
      if(r) {
        if(/^(?:[^\W_](?:[^\W_]|-){0,61}[^\W_]\.)+[a-zA-Z]{2,6}\.?$/.test(this.value)){
          return {
            status:true
          }
        }else{
          return {
            status:false,
            msg:'请输入正确的域名!'
          }
        }
      }
    },
    port:function(r){
      if(r){
        if(/^\d+$/.test(this.value) && this.value<65535){
          return {
            status:true
          }
        }else{
          return {
            status:false,
            msg:'请输入正确的端口号'
          }
        }
      }
    },
    lengthLimit:function(range){
      var fc=range.substr(0,1),
        sc=range.substr(range.length-1,1),
        min=range.substring(1,range.indexOf(",")),
        max=range.substring(range.indexOf(",")+1,range.length-1),
        fe=fc=="(" ? this.value.length>min : this.value.length>=min,
        se=sc==")" ? this.value.length<max : this.value.length<=max;
      if(!fe || !se){
        return {
          status:false,
          msg:"请确认输入的字符长度在"+range+"之间!"
        }
      }else{
        return {
          status:true
        }
      }
    },
    numberLimit:function(range){
      var fc=range.substr(0,1),
        sc=range.substr(range.length-1,1),
        min=range.substring(1,range.indexOf(",")),
        max=range.substring(range.indexOf(",")+1,range.length-1),
        fe=(fc=="(") ? this.value>min : this.value>=min,
        se=(sc==")") ? this.value<max : this.value<=max;
      if(!fe || !se){
        return {
          status:false,
          msg:"请确认输入大小在"+range+"之间的数字！"
        }
      }else{
        return {
          status:true
        }
      }
    },
    check:function(url){
      /*need jquery's support*/
      $.ajax({
        url:url,
        param:{value:this.value},
        asyn:false,
        contentType:"json",
        dataType:"json",
        success:function(data){
          return data;
        },
        error:function(){
          return {
            status:false,
            msg:"请求超时，请重试！"
          }
        }
      })
    }
  },
  addValidation:function(name,fn,deep){
    if(typeof fn=="function"){
      if(deep){
        this.constructor.prototype.validations[name]=fn;
      }
      this.validations[name]=fn;
    }
  }
}
define(function(require,exports){
  exports.Validator=Validator;
})
/*
注：请将required规则放在第一位.
var validator=new Validator({
  name:{
    required:true,
    zhOnly:true,
    lengthLimit:"(1,4)"
  },
  age:{
    required:true,
    numberLimit:"(10,20)"
  }
})
var note1=document.getElementById("name");
var note2=document.getElementById("age");
var data={
  name:{
    value:"中文四个",
    note:note1
  },
  age:{
    value:10,
    note:note2
  }

}*/
