var helpers = require("./helpers");
var AWS = require("aws-sdk");
var SqsCmd = require("./sqscommand");
var AWS_CONFIG_FILE = "./config.json";
var SQS_CONFIG_FILE = "./sqsconfig.json";


AWS.config.loadFromPath(AWS_CONFIG_FILE);
var SQS = new AWS.SQS();
var queueUrl = helpers.readJSONFile(SQS_CONFIG_FILE).QueueURL;
var s3 = new AWS.S3();

(function(){
    function _pool(){
        SqsCmd.receive(SQS,queueUrl,function(err,receivedMsg){
            if(err) console.log(err);
            else {
                if(receivedMsg.Messages && 
                   receivedMsg.Messages[0].MessageAttributes && 
                   receivedMsg.Messages[0].MessageAttributes.hasOwnProperty('Bucket')&& 
                   receivedMsg.Messages[0].MessageAttributes.hasOwnProperty('Key')){
                   var attr = receivedMsg.Messages[0].MessageAttributes;
                    console.log("Wiaderko:",attr.Bucket.StringValue,"Plik:",attr.Key.StringValue);
                    SqsCmd.delete(SQS,queueUrl,receivedMsg.Messages[0].ReceiptHandle,function(err,data){
                                    if(err){
                                        console.log("Can't remove message",err);
                                        return;
                                    }
                                    var objParams = {Bucket:attr.Bucket.StringValue,
                                                    Key:attr.Key.StringValue};
                                    s3.getObject(objParams,function(err, data){
                                            if(err) {
                                                console.log("Can't get object",err);
                                                return;
                                            }
                                            SqsCmd.send(SQS,queueUrl,"Obliczone :D",function(err,data){
                                                if(err){
                                                    console.log("Can't put msg on queue",err);
                                                    return;
                                                }
                                                console.log("DONE"); 
                                            },{
                                                Filename:{
                                                    DataType:'String',
                                                    StringValue: objParams.Key
                                                },
                                                Bucket:{
                                                    DataType:'String',
                                                    StringValue: objParams.Bucket
                                                },
                                                Hash:{
                                                    DataType:'String',
                                                    StringValue: helpers.calculateDigest("md5",data.Body,'hex')
                                                }
                                            });
                                        });
                                });
                    }
                return _pool();
            }
            
        },['Bucket','Key']);
    }
   // while(true){
    _pool();    
   // }
})();

