var SqsCommand = {
    send: function(queue,url,message,callback,messageKeys){
        var params = {
            MessageBody: message,
            QueueUrl: url,
            DelaySeconds: 0,
            MessageAttributes:messageKeys || {}
        };
        queue.sendMessage(params,callback);
    },
    receive: function(queue,url,callback,attrNames){
        var params = {
            QueueUrl: url,
            MaxNumberOfMessages: 1,
            VisibilityTimeout: 5,
            WaitTimeSeconds: 5,
            MessageAttributeNames:attrNames || []
        };
        queue.receiveMessage(params,callback);
    },
    delete: function(queue,url,id,callback){
        var params = {
            QueueUrl: url,
            ReceiptHandle: id
        };
        queue.deleteMessage(params,callback);
    },
    pop: function(queue,url,callback,attrNames){
        SqsCommand.receive(queue,url,function(err,messageData){
            if(err) console.log("POP(RECIEVE) ERROR:",err);
            else {
                if(!messageData.Messages) {
                    return callback(new Error("No new messages"),null);
                }
                messageData = messageData.Messages[0];
                SqsCommand.delete(queue,url,messageData.ReceiptHandle,function(err,data){
                    if(err) console.log("POP(DELETE) ERROR:",err);
                    callback(err,messageData,data);
                });
            }
        },attrNames);
    }
};

function values(obj) {
  var arr = [];
  Object.keys(obj).forEach(function(e){
    arr.push(obj[e]);
  });
  return arr;
}

var SQSQueue = function(){
    (function(sqs,url){
        this.sqs = sqs;
        this.url = url;
    }).apply(this,arguments);
};

Object.keys(SqsCommand).forEach(function(method){
    SQSQueue.prototype[method] = function(){
        var args = values(arguments);
        args.unshift(this.url);
        args.unshift(this.sqs);
        SqsCommand[method].apply(this, args);
    };
});

exports.SqsCommand = SqsCommand;
exports.SQSQueue = SQSQueue;


