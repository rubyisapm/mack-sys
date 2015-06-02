/**
 * Created by ruby on 2014/12/27.
 */
define({
  isEmpty:function(obj){
    for(var i in obj){
      return false;
    }
    return true;
  },
  extend:function(obj1,obj2){
    for(var i in obj2){
      obj1[i]=obj2[i];
    }
  }
})