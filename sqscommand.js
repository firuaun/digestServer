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
            console.log(err,messageData);
            if(err) console.log(err);
            else {
                SqsCommand.delete(queue,url,messageData.MessageId,function(err,data){
                    if(err) console.log(err);
                    callback(err,messageData,data);
                });
            }
        },attrNames);
    }
};

module.exports = SqsCommand;

